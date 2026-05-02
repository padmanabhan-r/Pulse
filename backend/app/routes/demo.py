"""Demo extract endpoint — no auth, for hackathon UI wiring.

POST /v1/demo/extract  { transcript: str } -> ExtractionResult
"""

from __future__ import annotations

import re

import structlog
from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import get_settings
from app.models.schemas import ExtractedTask, ExtractionResult, Priority
from app.services.extract import extract_from_text

router = APIRouter()
log = structlog.get_logger()


class DemoBody(BaseModel):
    transcript: str = Field(min_length=4, max_length=10_000)


def _heuristic_fallback(text: str) -> ExtractionResult:
    """Regex-only fallback so demo stays alive when Gemini key is absent or model errors."""
    pattern = re.compile(
        r"(?:need to|will|should|going to|todo:?|gotta|have to|let's)\s+([^.!?\n]{6,140})",
        re.IGNORECASE,
    )
    tasks: list[ExtractedTask] = []
    for m in pattern.finditer(text):
        title = m.group(1).strip().rstrip(",;")
        if title and not any(t.title == title for t in tasks):
            tasks.append(
                ExtractedTask(
                    title=title[:140],
                    description=None,
                    priority=Priority.medium,
                    confidence=0.5,
                )
            )
    return ExtractionResult(tasks=tasks[:6], blockers=[], summary="(heuristic fallback)")


@router.post("/extract", response_model=ExtractionResult)
async def demo_extract(body: DemoBody) -> ExtractionResult:
    settings = get_settings()
    if not settings.gemini_api_key:
        return _heuristic_fallback(body.transcript)
    try:
        return extract_from_text(body.transcript)
    except Exception as exc:
        log.warning("demo.gemini_failed_fallback", error=str(exc))
        return _heuristic_fallback(body.transcript)
