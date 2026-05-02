"""Auth-protected routes return 401 without bearer."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.mark.parametrize(
    "method,path,body",
    [
        ("post", "/v1/workspaces", {"name": "Pulse"}),
        ("get", "/v1/workspaces/abc", None),
        ("post", "/v1/standup", {"workspace_id": "abc", "transcript": "hi" * 20}),
        ("post", "/v1/tasks", {"workspace_id": "abc", "title": "X"}),
        ("get", "/v1/blockers/abc", None),
    ],
)
def test_requires_bearer(method: str, path: str, body: dict | None) -> None:
    with TestClient(app) as c:
        resp = c.request(method, path, json=body)
    assert resp.status_code == 401
