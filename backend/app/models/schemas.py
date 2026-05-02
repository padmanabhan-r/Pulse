"""Pydantic schemas. Single source of truth for request/response + Gemini structured output."""

from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field


class Priority(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    urgent = "urgent"


class TaskStatus(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    blocked = "blocked"
    done = "done"


class Role(str, Enum):
    owner = "owner"
    admin = "admin"
    member = "member"


class ExtractedTask(BaseModel):
    """Gemini-extracted task. Validated before write to Firestore."""

    title: str = Field(min_length=3, max_length=140)
    description: str | None = Field(default=None, max_length=2000)
    assignee_hint: str | None = Field(default=None, description="Free-text name/handle from speech")
    priority: Priority = Priority.medium
    deadline_iso: str | None = Field(default=None, description="ISO8601 if mentioned")
    confidence: float = Field(ge=0, le=1)


class ExtractedBlocker(BaseModel):
    summary: str = Field(min_length=3, max_length=200)
    blocker_type: str = Field(default="generic", description="generic | dependency | review | external")
    severity: Priority = Priority.medium
    suggested_owner_hint: str | None = None
    confidence: float = Field(ge=0, le=1)


class ExtractionResult(BaseModel):
    tasks: list[ExtractedTask] = Field(default_factory=list, max_length=20)
    blockers: list[ExtractedBlocker] = Field(default_factory=list, max_length=10)
    summary: str = Field(default="", max_length=500)


class Workspace(BaseModel):
    id: str
    name: str = Field(min_length=2, max_length=80)
    owner_uid: str
    created_at: datetime


class Member(BaseModel):
    uid: str
    email: str | None = None
    display_name: str | None = None
    role: Role = Role.member


class Task(BaseModel):
    id: str
    workspace_id: str
    title: str
    description: str | None = None
    status: TaskStatus = TaskStatus.todo
    priority: Priority = Priority.medium
    assignee_uid: str | None = None
    deadline_iso: str | None = None
    created_by: str
    created_at: datetime
    updated_at: datetime
    source: str = Field(default="manual", description="manual | standup | slack | live")


class Blocker(BaseModel):
    id: str
    workspace_id: str
    task_id: str | None = None
    summary: str
    severity: Priority = Priority.medium
    owner_uid: str | None = None
    resolved: bool = False
    created_at: datetime
