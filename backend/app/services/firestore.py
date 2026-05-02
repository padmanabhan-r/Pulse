"""Firestore admin SDK wrapper. Single client, lazy init."""

from __future__ import annotations

from functools import lru_cache

from google.cloud import firestore

from app.config import get_settings


@lru_cache
def db() -> firestore.Client:
    """Return cached Firestore client. One client per process; safe for concurrent async use."""
    settings = get_settings()
    return firestore.Client(project=settings.gcp_project)


def workspace_doc(workspace_id: str) -> firestore.DocumentReference:
    """Return DocumentReference for a workspace. Does not perform a network read."""
    return db().collection("workspaces").document(workspace_id)


def is_member(workspace_id: str, uid: str) -> bool:
    """Check workspace membership. One Firestore read; called on every authed route."""
    member = workspace_doc(workspace_id).collection("members").document(uid).get()
    return member.exists
