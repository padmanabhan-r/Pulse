"""Task CRUD."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser
from app.models.schemas import Priority, TaskStatus
from app.security.auth import AuthUser
from app.services.firestore import is_member, workspace_doc

router = APIRouter()


class TaskBody(BaseModel):
    """Manual task creation request. workspace_id scopes the write."""

    workspace_id: str
    title: str = Field(min_length=2, max_length=140)
    description: str | None = Field(default=None, max_length=2000)
    priority: Priority = Priority.medium
    assignee_uid: str | None = None
    deadline_iso: str | None = None


class TaskUpdateBody(BaseModel):
    """Partial update — only supplied fields are written. None fields are excluded from the Firestore update."""

    title: str | None = None
    description: str | None = None
    status: TaskStatus | None = None
    priority: Priority | None = None
    assignee_uid: str | None = None
    deadline_iso: str | None = None


class TaskOut(BaseModel):
    """Lightweight task response for create/update. Full schema in models.schemas.Task."""

    id: str
    title: str
    status: TaskStatus
    priority: Priority


@router.post("", response_model=TaskOut)
async def create_task(body: TaskBody, user: AuthUser = CurrentUser) -> TaskOut:
    """Create a manual task and write to Firestore. Source tagged 'manual' to distinguish from standup/slack."""
    if not is_member(body.workspace_id, user.uid):
        raise HTTPException(status_code=403, detail="not_a_member")
    now = datetime.now(tz=timezone.utc)
    ref = workspace_doc(body.workspace_id).collection("tasks").document()
    ref.set(
        {
            "title": body.title,
            "description": body.description,
            "priority": body.priority.value,
            "assignee_uid": body.assignee_uid,
            "deadline_iso": body.deadline_iso,
            "status": TaskStatus.todo.value,
            "created_by": user.uid,
            "created_at": now,
            "updated_at": now,
            "source": "manual",
        }
    )
    return TaskOut(id=ref.id, title=body.title, status=TaskStatus.todo, priority=body.priority)


@router.patch("/{workspace_id}/{task_id}", response_model=TaskOut)
async def update_task(
    workspace_id: str, task_id: str, body: TaskUpdateBody, user: AuthUser = CurrentUser
) -> TaskOut:
    """Partial-update a task. Enum fields serialised to string values before Firestore write."""
    if not is_member(workspace_id, user.uid):
        raise HTTPException(status_code=403, detail="not_a_member")
    ref = workspace_doc(workspace_id).collection("tasks").document(task_id)
    snap = ref.get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="not_found")
    updates = body.model_dump(exclude_none=True)
    if "status" in updates:
        updates["status"] = updates["status"].value
    if "priority" in updates:
        updates["priority"] = updates["priority"].value
    updates["updated_at"] = datetime.now(tz=timezone.utc)
    ref.update(updates)
    fresh = ref.get().to_dict() or {}
    return TaskOut(
        id=task_id,
        title=fresh.get("title", ""),
        status=TaskStatus(fresh.get("status", "todo")),
        priority=Priority(fresh.get("priority", "medium")),
    )
