"""Slack endpoints: events subscription + slash commands.

Security:
- HMAC-SHA256 signature verify with constant-time compare
- Replay protection: reject if X-Slack-Request-Timestamp >5 min old
- Async ack within 3s (Slack timeout); processing happens off-band
"""

from __future__ import annotations

import json
from typing import Any

import structlog
from fastapi import APIRouter, BackgroundTasks, Header, HTTPException, Request, status

from app.services.extract import extract_from_text
from app.services.slack import verify_signature

router = APIRouter()
log = structlog.get_logger()


def _require_signed(body: bytes, timestamp: str | None, signature: str | None) -> None:
    """Guard for all Slack endpoints. Raises 401 if signature missing or invalid."""
    if not timestamp or not signature:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="missing_signature")
    if not verify_signature(body=body, timestamp=timestamp, signature=signature):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="bad_signature")


async def _process_message_event(event: dict[str, Any], team_id: str) -> None:
    """Heavy work: extract tasks, write to Firestore, optionally reply in thread."""
    text = event.get("text", "")
    if not text or event.get("subtype"):
        return
    try:
        result = extract_from_text(text)
    except Exception as exc:
        log.exception("slack.extract_failed", error=str(exc), team=team_id)
        return
    log.info(
        "slack.extracted",
        team=team_id,
        channel=event.get("channel"),
        tasks=len(result.tasks),
        blockers=len(result.blockers),
    )
    # Firestore write + thread-reply lands when channel→workspace mapping wired.


@router.post("/events")
async def slack_events(  # noqa: PLR0911
    request: Request,
    background: BackgroundTasks,
    x_slack_signature: str | None = Header(default=None),
    x_slack_request_timestamp: str | None = Header(default=None),
) -> dict[str, Any]:
    """Handle Slack Events API callbacks. Acks synchronously; heavy work runs in background task."""
    body = await request.body()
    _require_signed(body, x_slack_request_timestamp, x_slack_signature)
    payload = json.loads(body or b"{}")

    # Slack sends a one-time challenge during Events API subscription setup.
    if payload.get("type") == "url_verification":
        return {"challenge": payload.get("challenge", "")}

    if payload.get("type") == "event_callback":
        event = payload.get("event") or {}
        team_id = payload.get("team_id", "")
        if event.get("type") == "message":
            background.add_task(_process_message_event, event, team_id)
        return {"ok": True}

    return {"ok": True}


@router.post("/commands")
async def slack_commands(
    request: Request,
    x_slack_signature: str | None = Header(default=None),
    x_slack_request_timestamp: str | None = Header(default=None),
) -> dict[str, Any]:
    """Handle /pulse slash command. Ephemeral ack so only the caller sees the response."""
    body = await request.body()
    _require_signed(body, x_slack_request_timestamp, x_slack_signature)
    form = dict((await request.form()).items())
    command = form.get("command", "")
    text = form.get("text", "")
    if command == "/pulse" and text:
        return {
            "response_type": "ephemeral",
            "text": f":zap: Captured. Pulse will extract tasks from: _{text[:120]}_",
        }
    return {"response_type": "ephemeral", "text": "Unknown command."}
