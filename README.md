# Pulse

**Speak it. Ship it. See it.**

AI team collaboration platform. Voice-first standups → auto-extracted tasks → live blocker graph → Slack 2-way sync. Built on Gemini 3.

PromptWars × Build with AI hackathon submission. Team Collaboration Tool challenge.

## What it does
- **Voice standup** — Gemini Live captures your update; tasks materialise on the Kanban as you speak.
- **Live ticker** — every team voice-update streams across the dashboard like a stock tape.
- **Blocker graph** — d3 force graph pulses coral the moment someone is stuck; owner gets pinged in-app and on Slack.
- **Slack 2-way** — passive Events API listener extracts tasks from channel chatter; outbound webhook posts blocker pings and daily digests back.
- **Calendar export** — assigned tasks land in Google Calendar with one click.

## Stack
- **Frontend**: Next.js 16 (App Router) + TypeScript + Tailwind + shadcn/ui
- **Backend**: FastAPI + Python 3.12 + uv + Pydantic v2
- **AI**: Gemini 3 Pro / Flash / Live (`google-genai` SDK)
- **Realtime / DB**: Firestore
- **Auth**: Firebase Auth (Google Sign-In)
- **Deploy**: Cloud Run (backend) + Firebase Hosting (frontend)

## Google services
Gemini 3 Pro, Gemini 3 Flash, Gemini Live, Firebase Auth, Firestore, Cloud Storage, Cloud Run, Cloud Build, Cloud Tasks, Secret Manager, Cloud KMS, Cloud Logging, Google Calendar API, Firebase Hosting.

## Repo layout
```
TeamColab/
├── backend/      # FastAPI on Cloud Run
├── frontend/     # Next.js 16 on Firebase Hosting
├── infra/        # Cloud Build, Firestore rules, Firebase config
└── sample/       # Reference projects + Gemini docs
```

## Develop locally
```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload

# Frontend
cd frontend
pnpm install
pnpm dev
```

## Deploy

### Quick deploy (single project, demo mode)

Backend → Cloud Run:
```bash
gcloud run deploy pulse-api \
  --source backend \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi --cpu 1 --concurrency 80 \
  --min-instances 0 --max-instances 5 \
  --set-env-vars "ENV=demo,GCP_PROJECT=$(gcloud config get-value project),CORS_ORIGINS=[\"*\"]"
```

Frontend → Cloud Run (static nginx, baked API base):
```bash
BACKEND_URL=$(gcloud run services describe pulse-api --region us-central1 --format='value(status.url)')
cat > frontend/.env.production <<EOF
NEXT_PUBLIC_API_BASE=${BACKEND_URL}
NEXT_PUBLIC_WS_BASE=${BACKEND_URL/https/wss}
EOF
gcloud run deploy pulse-web \
  --source frontend \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi --cpu 1
```

### Full pipeline
```bash
gcloud builds submit --config infra/cloudbuild.yaml
```

## License
MIT
