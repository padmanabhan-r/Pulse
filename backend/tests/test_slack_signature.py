"""Slack signature verification tests. Replay + tamper protection."""

from __future__ import annotations

import hashlib
import hmac
import time

import pytest

from app.config import get_settings
from app.services.slack import verify_signature


@pytest.fixture(autouse=True)
def _set_signing_secret(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("SLACK_SIGNING_SECRET", "test_secret")
    get_settings.cache_clear()


def _sign(body: bytes, ts: str, secret: str = "test_secret") -> str:
    base = f"v0:{ts}:".encode() + body
    return "v0=" + hmac.new(secret.encode(), base, hashlib.sha256).hexdigest()


def test_valid_signature_passes() -> None:
    body = b'{"type":"url_verification","challenge":"abc"}'
    ts = str(int(time.time()))
    sig = _sign(body, ts)
    assert verify_signature(body=body, timestamp=ts, signature=sig) is True


def test_replay_rejected() -> None:
    body = b'{"x":1}'
    old_ts = str(int(time.time()) - 600)  # 10 min old
    sig = _sign(body, old_ts)
    assert verify_signature(body=body, timestamp=old_ts, signature=sig) is False


def test_tampered_body_rejected() -> None:
    body = b'{"x":1}'
    ts = str(int(time.time()))
    sig = _sign(body, ts)
    assert verify_signature(body=b'{"x":2}', timestamp=ts, signature=sig) is False


def test_wrong_secret_rejected() -> None:
    body = b'{"x":1}'
    ts = str(int(time.time()))
    sig = _sign(body, ts, secret="evil")
    assert verify_signature(body=body, timestamp=ts, signature=sig) is False


def test_missing_timestamp_rejected() -> None:
    body = b'{}'
    assert verify_signature(body=body, timestamp="not-a-number", signature="v0=00") is False
