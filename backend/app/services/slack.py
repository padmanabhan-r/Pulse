"""Slack integration: signature verify + outbound webhook + Block Kit builders."""

from __future__ import annotations

import hashlib
import hmac
import time
from typing import Any

import httpx

from app.config import get_settings


def verify_signature(*, body: bytes, timestamp: str, signature: str) -> bool:
    """Constant-time HMAC-SHA256 verify per Slack docs. Reject if timestamp >5 min old."""
    settings = get_settings()
    if not settings.slack_signing_secret:
        return False
    try:
        ts = int(timestamp)
    except (TypeError, ValueError):
        return False
    if abs(time.time() - ts) > 300:
        return False
    basestring = f"v0:{timestamp}:".encode() + body
    digest = hmac.new(
        settings.slack_signing_secret.encode(),
        basestring,
        hashlib.sha256,
    ).hexdigest()
    expected = f"v0={digest}"
    return hmac.compare_digest(expected, signature)


def block_kit_blocker(
    *,
    summary: str,
    severity: str,
    pulse_link: str,
    task_id: str | None = None,
) -> dict[str, Any]:
    """Build a Block Kit message for a blocker ping."""
    sev_emoji = {"low": ":small_blue_diamond:", "medium": ":warning:", "high": ":rotating_light:", "urgent": ":fire:"}
    icon = sev_emoji.get(severity, ":warning:")
    blocks: list[dict[str, Any]] = [
        {
            "type": "header",
            "text": {"type": "plain_text", "text": f"{icon} Blocker detected", "emoji": True},
        },
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*{summary}*"},
        },
        {
            "type": "context",
            "elements": [
                {"type": "mrkdwn", "text": f"_severity: {severity}_"},
                *([{"type": "mrkdwn", "text": f"_task: `{task_id}`_"}] if task_id else []),
            ],
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {"type": "plain_text", "text": "View in Pulse"},
                    "url": pulse_link,
                    "style": "primary",
                }
            ],
        },
    ]
    return {"blocks": blocks, "text": f"Blocker: {summary}"}


async def post_webhook(webhook_url: str, payload: dict[str, Any]) -> None:
    """Fire-and-forget post to a Slack incoming webhook."""
    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.post(webhook_url, json=payload)
        resp.raise_for_status()
