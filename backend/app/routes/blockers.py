"""Blocker list + resolve."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.deps import CurrentUser
from app.models.schemas import Priority
from app.security.auth import AuthUser
from app.services.firestore import is_member, workspace_doc

router = APIRouter()


class BlockerOut(BaseModel):
    id: str
    summary: str
    severity: Priority
    resolved: bool


@router.get("/{workspace_id}", response_model=list[BlockerOut])
async def list_blockers(workspace_id: str, user: AuthUser = CurrentUser) -> list[BlockerOut]:
    if not is_member(workspace_id, user.uid):
        raise HTTPException(status_code=403, detail="not_a_member")
    docs = workspace_doc(workspace_id).collection("blockers").where("resolved", "==", False).stream()
    return [
        BlockerOut(
            id=d.id,
            summary=(d.to_dict() or {}).get("summary", ""),
            severity=Priority((d.to_dict() or {}).get("severity", "medium")),
            resolved=False,
        )
        for d in docs
    ]


@router.post("/{workspace_id}/{blocker_id}/resolve")
async def resolve_blocker(workspace_id: str, blocker_id: str, user: AuthUser = CurrentUser) -> dict[str, str]:
    if not is_member(workspace_id, user.uid):
        raise HTTPException(status_code=403, detail="not_a_member")
    ref = workspace_doc(workspace_id).collection("blockers").document(blocker_id)
    if not ref.get().exists:
        raise HTTPException(status_code=404, detail="not_found")
    ref.update({"resolved": True, "resolved_by": user.uid})
    return {"status": "resolved"}
