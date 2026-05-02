"""Firebase ID token verification."""

from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache

import firebase_admin
from firebase_admin import auth as fb_auth
from firebase_admin import credentials


@dataclass(frozen=True, slots=True)
class AuthUser:
    """Decoded Firebase token fields. Immutable; passed through request lifecycle as the principal."""
    uid: str
    email: str | None
    name: str | None
    picture: str | None


@lru_cache
def _init_firebase() -> firebase_admin.App:
    try:
        return firebase_admin.get_app()
    except ValueError:
        # ADC on Cloud Run picks up the service account automatically.
        return firebase_admin.initialize_app(credentials.ApplicationDefault())


def verify_id_token(token: str) -> AuthUser:
    """Verify Firebase ID token and return principal. Raises ValueError on any invalid/expired token."""
    _init_firebase()
    try:
        decoded = fb_auth.verify_id_token(token, check_revoked=False)
    except (fb_auth.InvalidIdTokenError, fb_auth.ExpiredIdTokenError, fb_auth.RevokedIdTokenError) as exc:
        raise ValueError(f"invalid_token: {exc}") from exc
    return AuthUser(
        uid=decoded["uid"],
        email=decoded.get("email"),
        name=decoded.get("name"),
        picture=decoded.get("picture"),
    )
