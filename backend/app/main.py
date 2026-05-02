"""FastAPI app bootstrap. Wires routes, middleware, exception handlers, observability."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.routes import blockers, demo, live, slack, standup, tasks, workspaces

settings = get_settings()


def _configure_logging() -> None:
    logging.basicConfig(
        format="%(message)s",
        level=getattr(logging, settings.log_level.upper(), logging.INFO),
    )
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, settings.log_level.upper(), logging.INFO)
        ),
    )


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    _configure_logging()
    log = structlog.get_logger()
    log.info("pulse.boot", env=settings.env, project=settings.gcp_project)
    yield
    log.info("pulse.shutdown")


limiter = Limiter(key_func=get_remote_address, default_limits=[f"{settings.rate_limit_per_minute}/minute"])

app = FastAPI(
    title="Pulse API",
    version="0.1.0",
    description="AI team collaboration backend.",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Slack-Signature", "X-Slack-Request-Timestamp"],
    max_age=600,
)


@app.middleware("http")
async def security_headers(request: Request, call_next):  # type: ignore[no-untyped-def]
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=(self)"
    return response


@app.get("/health", tags=["meta"])
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "pulse-api", "env": settings.env}


app.include_router(workspaces.router, prefix="/v1/workspaces", tags=["workspaces"])
app.include_router(standup.router, prefix="/v1/standup", tags=["standup"])
app.include_router(tasks.router, prefix="/v1/tasks", tags=["tasks"])
app.include_router(blockers.router, prefix="/v1/blockers", tags=["blockers"])
app.include_router(live.router, prefix="/v1/live", tags=["live"])
app.include_router(slack.router, prefix="/slack", tags=["slack"])
app.include_router(demo.router, prefix="/v1/demo", tags=["demo"])


@app.exception_handler(Exception)
async def unhandled_exc(_: Request, exc: Exception) -> JSONResponse:
    structlog.get_logger().exception("pulse.unhandled", error=str(exc))
    return JSONResponse(status_code=500, content={"detail": "internal_error"})
