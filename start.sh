#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT="${BACKEND_PORT:-8080}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"

free_port() {
  local port="$1" pids
  pids="$(lsof -ti tcp:"$port" || true)"
  if [[ -n "$pids" ]]; then
    echo "▶ killing pid(s) on :$port → $pids"
    kill -9 $pids 2>/dev/null || true
    sleep 0.4
  fi
}

cleanup() {
  echo
  echo "▶ shutting down…"
  [[ -n "${BE_PID:-}" ]] && kill "$BE_PID" 2>/dev/null || true
  [[ -n "${FE_PID:-}" ]] && kill "$FE_PID" 2>/dev/null || true
  free_port "$BACKEND_PORT"
  free_port "$FRONTEND_PORT"
  exit 0
}
trap cleanup INT TERM EXIT

echo "▶ Pulse · local"
free_port "$BACKEND_PORT"
free_port "$FRONTEND_PORT"

echo "▶ backend  → http://localhost:$BACKEND_PORT"
( cd "$ROOT/backend" && uv run uvicorn app.main:app --host 0.0.0.0 --port "$BACKEND_PORT" --reload ) \
  > "$ROOT/.tmp/backend.log" 2>&1 &
BE_PID=$!
mkdir -p "$ROOT/.tmp"

echo "▶ frontend → http://localhost:$FRONTEND_PORT"
( cd "$ROOT/frontend" && pnpm dev ) > "$ROOT/.tmp/frontend.log" 2>&1 &
FE_PID=$!

# Wait for backend health
for i in {1..40}; do
  if curl -fsS "http://localhost:$BACKEND_PORT/health" >/dev/null 2>&1; then
    echo "✓ backend ready"
    break
  fi
  sleep 0.5
done

# Wait for frontend
for i in {1..40}; do
  if curl -fsS "http://localhost:$FRONTEND_PORT" >/dev/null 2>&1; then
    echo "✓ frontend ready"
    break
  fi
  sleep 0.5
done

echo
echo "  ◉ Pulse running"
echo "  ─ backend   http://localhost:$BACKEND_PORT/health"
echo "  ─ frontend  http://localhost:$FRONTEND_PORT"
echo "  ─ logs      .tmp/backend.log · .tmp/frontend.log"
echo "  ─ Ctrl+C to stop both"
echo

wait
