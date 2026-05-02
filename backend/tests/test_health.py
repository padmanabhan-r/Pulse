"""Smoke test: /health responds 200 without auth."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import app


def test_health() -> None:
    with TestClient(app) as c:
        r = c.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["service"] == "pulse-api"
