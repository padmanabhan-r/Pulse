"""Prompt-injection guard. Wrap untrusted user input before it reaches Gemini."""

from __future__ import annotations

import re

# Patterns flagged for redaction before model call. Conservative — false-positive bias.
PII_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("email", re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")),
    ("phone", re.compile(r"\+?\d[\d\s().-]{8,}\d")),
    ("card", re.compile(r"\b(?:\d[ -]*?){13,19}\b")),
    ("ssn", re.compile(r"\b\d{3}-\d{2}-\d{4}\b")),
)

USER_DELIMITER_OPEN = "<<<USER_INPUT>>>"
USER_DELIMITER_CLOSE = "<<<END_USER_INPUT>>>"


def redact_pii(text: str) -> str:
    """Replace PII matches with type tokens."""
    redacted = text
    for label, pattern in PII_PATTERNS:
        redacted = pattern.sub(f"[REDACTED_{label.upper()}]", redacted)
    return redacted


def fence_user_input(text: str) -> str:
    """
    Wrap untrusted input in delimiters so model treats it as data, not instructions.
    Strip our own delimiters from the input first to prevent escape.
    """
    cleaned = text.replace(USER_DELIMITER_OPEN, "").replace(USER_DELIMITER_CLOSE, "")
    return f"{USER_DELIMITER_OPEN}\n{cleaned}\n{USER_DELIMITER_CLOSE}"


def safe_user_text(text: str, *, max_chars: int = 10_000) -> str:
    """One-shot: redact PII, truncate, fence."""
    truncated = text[:max_chars]
    return fence_user_input(redact_pii(truncated))
