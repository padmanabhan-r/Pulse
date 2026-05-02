"""Firestore admin SDK wrapper. Single client, lazy init."""

from __future__ import annotations

from functools import lru_cache

from google.cloud import firestore

from app.config import get_settings


@lru_cache
def db() -> firestore.Client:
    settings = get_settings()
    return firestore.Client(project=settings.gcp_project)


def workspace_doc(workspace_id: str) -> firestore.DocumentReference:
    return db().collection("workspaces").document(workspace_id)


def is_member(workspace_id: str, uid: str) -> bool:
    member = workspace_doc(workspace_id).collection("members").document(uid).get()
    return member.exists
