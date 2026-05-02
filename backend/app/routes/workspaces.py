"""Workspace CRUD."""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.deps import CurrentUser
from app.models.schemas import Role
from app.security.auth import AuthUser
from app.services.firestore import db, workspace_doc

router = APIRouter()


class CreateWorkspaceBody(BaseModel):
    name: str = Field(min_length=2, max_length=80)


class WorkspaceOut(BaseModel):
    id: str
    name: str
    role: Role


@router.post("", response_model=WorkspaceOut)
async def create_workspace(body: CreateWorkspaceBody, user: AuthUser = CurrentUser) -> WorkspaceOut:
    now = datetime.now(tz=timezone.utc)
    ref = db().collection("workspaces").document()
    ref.set({"name": body.name, "owner_uid": user.uid, "created_at": now})
    ref.collection("members").document(user.uid).set(
        {"uid": user.uid, "email": user.email, "display_name": user.name, "role": Role.owner.value}
    )
    return WorkspaceOut(id=ref.id, name=body.name, role=Role.owner)


@router.get("/{workspace_id}", response_model=WorkspaceOut)
async def get_workspace(workspace_id: str, user: AuthUser = CurrentUser) -> WorkspaceOut:
    snap = workspace_doc(workspace_id).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="not_found")
    member = workspace_doc(workspace_id).collection("members").document(user.uid).get()
    if not member.exists:
        raise HTTPException(status_code=403, detail="not_a_member")
    data = snap.to_dict() or {}
    return WorkspaceOut(id=workspace_id, name=data.get("name", ""), role=Role(member.to_dict().get("role", "member")))
