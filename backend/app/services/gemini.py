"""Gemini client + prompt cache. Reuses single client across requests for efficiency."""

from __future__ import annotations

from functools import lru_cache

from google import genai
from google.genai import types

from app.config import get_settings


@lru_cache
def client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)


def generate_json(
    *,
    model: str,
    system: str,
    user: str,
    schema: type,
    cached_content: str | None = None,
) -> dict:
    """One-shot JSON generation with response_schema. Pydantic class as schema."""
    cfg = types.GenerateContentConfig(
        system_instruction=system,
        response_mime_type="application/json",
        response_schema=schema,
        temperature=0.2,
    )
    if cached_content:
        cfg.cached_content = cached_content
    resp = client().models.generate_content(model=model, contents=user, config=cfg)
    parsed = resp.parsed
    if parsed is None:
        raise RuntimeError("gemini_no_parsed_output")
    if hasattr(parsed, "model_dump"):
        return parsed.model_dump()
    return dict(parsed)
