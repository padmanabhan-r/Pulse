"""Google Calendar export. Uses delegated user OAuth credentials (per-user, not service-account)."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any

from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build


def export_task_to_calendar(
    *,
    user_credentials: Credentials,
    title: str,
    description: str,
    deadline_iso: str | None,
    pulse_link: str,
) -> str:
    """Insert event on user's primary calendar. Returns event id."""
    service = build("calendar", "v3", credentials=user_credentials, cache_discovery=False)
    if deadline_iso:
        start = datetime.fromisoformat(deadline_iso)
    else:
        start = datetime.now(tz=timezone.utc) + timedelta(hours=24)
    end = start + timedelta(minutes=30)
    event: dict[str, Any] = {
        "summary": title,
        "description": f"{description}\n\nPulse: {pulse_link}",
        "start": {"dateTime": start.isoformat()},
        "end": {"dateTime": end.isoformat()},
        "source": {"title": "Pulse", "url": pulse_link},
    }
    created = service.events().insert(calendarId="primary", body=event).execute()
    return str(created["id"])
