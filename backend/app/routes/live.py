"""WebSocket bridge to Gemini Live for voice standup capture.

Browser opens WS w/ Firebase ID token in query, streams Opus audio frames,
receives caption tokens + final extraction events back.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

import structlog
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.config import get_settings
from app.security.auth import verify_id_token
from app.services.extract import extract_from_text

router = APIRouter()
log = structlog.get_logger()


@router.websocket("/standup/{workspace_id}")
async def live_standup(
    ws: WebSocket,
    workspace_id: str,
    token: str = Query(..., description="Firebase ID token"),
) -> None:
    """
    WebSocket handler for live voice standup.

    Protocol:
      client → {"type": "transcript_chunk", "text": "..."}  (streamed caption chunks)
      client → {"type": "stop"}                              (signals end of speech)
      server → {"type": "caption", "text": "..."}            (echoes chunks back for live display)
      server → {"type": "extraction", "data": {...}}         (final Gemini extraction result)
      server → {"type": "error", "detail": "..."}            (on extraction failure)
    """
    try:
        user = verify_id_token(token)
    except ValueError:
        await ws.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await ws.accept()
    log.info("live.connect", uid=user.uid, workspace=workspace_id)

    transcript_parts: list[str] = []
    settings = get_settings()
    _ = settings  # placeholder; full Gemini Live wiring lands in feature branch

    async def send_caption(text: str) -> None:
        await ws.send_text(json.dumps({"type": "caption", "text": text}))

    try:
        while True:
            msg = await ws.receive()
            if msg["type"] == "websocket.disconnect":
                break
            if (text := msg.get("text")) is not None:
                payload: dict[str, Any] = json.loads(text)
                if payload.get("type") == "transcript_chunk":
                    chunk = str(payload.get("text", ""))
                    transcript_parts.append(chunk)
                    await send_caption(chunk)
                elif payload.get("type") == "stop":
                    break
            # binary audio frames would forward to Gemini Live here
    except WebSocketDisconnect:
        pass

    full = " ".join(transcript_parts).strip()
    if full:
        try:
            extraction = await asyncio.to_thread(extract_from_text, full)
            await ws.send_text(json.dumps({"type": "extraction", "data": extraction.model_dump()}))
        except Exception as exc:
            log.exception("live.extract_failed", error=str(exc))
            await ws.send_text(json.dumps({"type": "error", "detail": "extraction_failed"}))
    await ws.close()
    log.info("live.disconnect", uid=user.uid)
