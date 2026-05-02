#!/usr/bin/env bash
set -euo pipefail

# Pulse — one-shot demo deploy.
# Usage: ./scripts/deploy.sh [region]

REGION="${1:-us-central1}"
PROJECT="$(gcloud config get-value project 2>/dev/null)"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "▶ Project: $PROJECT  Region: $REGION"

echo "▶ Deploying backend (pulse-api)…"
gcloud run deploy pulse-api \
  --source "$ROOT/backend" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi --cpu 1 --concurrency 80 \
  --min-instances 0 --max-instances 5 \
  --set-env-vars "ENV=demo,GCP_PROJECT=$PROJECT,CORS_ORIGINS=[\"*\"]" \
  --quiet

BACKEND_URL="$(gcloud run services describe pulse-api --region "$REGION" --format='value(status.url)')"
echo "▶ Backend: $BACKEND_URL"

echo "▶ Writing frontend/.env.production…"
cat > "$ROOT/frontend/.env.production" <<EOF
NEXT_PUBLIC_API_BASE=${BACKEND_URL}
NEXT_PUBLIC_WS_BASE=${BACKEND_URL/https/wss}
EOF

echo "▶ Deploying frontend (pulse-web)…"
gcloud run deploy pulse-web \
  --source "$ROOT/frontend" \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi --cpu 1 \
  --quiet

WEB_URL="$(gcloud run services describe pulse-web --region "$REGION" --format='value(status.url)')"
echo
echo "✅ Backend  : $BACKEND_URL"
echo "✅ Frontend : $WEB_URL"
