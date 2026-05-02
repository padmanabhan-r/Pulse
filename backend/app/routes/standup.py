"""Standup transcript ingestion. Audio path lives in /v1/live (WebSocket); this endpoint accepts text."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser
from app.models.schemas import ExtractionResult, TaskStatus
from app.security.auth import AuthUser
from app.services.extract import extract_from_text
from app.services.firestore import db, is_member, workspace_doc

router = APIRouter()


class StandupTextBody(BaseModel):
    """Request body for text-path standup submission (vs. live WebSocket path)."""

    workspace_id: str
    transcript: str = Field(min_length=10, max_length=10_000)


class StandupOut(BaseModel):
    """Response includes full extraction result plus the Firestore IDs written in this call."""

    extraction: ExtractionResult
    task_ids: list[str]
    blocker_ids: list[str]


@router.post("", response_model=StandupOut)
async def submit_standup(body: StandupTextBody, user: AuthUser = CurrentUser) -> StandupOut:
    """Extract tasks/blockers from transcript and persist to Firestore in a single batch write."""
    if not is_member(body.workspace_id, user.uid):
        raise HTTPException(status_code=403, detail="not_a_member")

    extraction = extract_from_text(body.transcript)
    now = datetime.now(tz=timezone.utc)
    task_ids: list[str] = []
    blocker_ids: list[str] = []

    ws_ref = workspace_doc(body.workspace_id)
    batch = db().batch()
    for t in extraction.tasks:
        ref = ws_ref.collection("tasks").document()
        batch.set(
            ref,
            {
                "title": t.title,
                "description": t.description,
                "priority": t.priority.value,
                "deadline_iso": t.deadline_iso,
                "status": TaskStatus.todo.value,
                "created_by": user.uid,
                "created_at": now,
                "updated_at": now,
                "source": "standup",
                "confidence": t.confidence,
            },
        )
        task_ids.append(ref.id)
    for b in extraction.blockers:
        ref = ws_ref.collection("blockers").document()
        batch.set(
            ref,
            {
                "summary": b.summary,
                "blocker_type": b.blocker_type,
                "severity": b.severity.value,
                "created_at": now,
                "resolved": False,
                "confidence": b.confidence,
                "source": "standup",
            },
        )
        blocker_ids.append(ref.id)
    batch.commit()
    return StandupOut(extraction=extraction, task_ids=task_ids, blocker_ids=blocker_ids)
