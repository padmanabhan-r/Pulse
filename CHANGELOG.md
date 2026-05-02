# Changelog

## v1.0.0 — The 1Mbps Battle (2026-05-02)

> *Battled the 1 Mbps speed in the age of AI at IITM Research Park, Raman Hall, to ship this.*
> — PromptWars Chennai

### Shipped

**Voice Standup**
- Gemini Live WebSocket bridge — real-time transcription as you speak
- Live caption overlay during recording
- Stop & Extract flow → Gemini Flash parses transcript into structured tasks

**Task Extraction**
- Auto-extracts assignee, priority, deadline, confidence score per card
- Blocker detection from natural language ("blocked on", "waiting on", "stuck")
- Cards drop directly onto shared Kanban

**Live Ticker**
- Firestore-backed real-time ticker — every teammate's voice update streams across dashboard
- Sub-second latency, no page reload

**Blocker Graph**
- d3 force-directed graph of team dependency relationships
- Coral edges pulse on blocked relationships
- Auto-pings blocked owner via in-app notification

**Kanban Board**
- Shared live board — drag cards across columns
- Cards rotate 2–3°, lime glow on drop

**Calendar Export**
- One-click push to Google Calendar
- Pre-fills task name, assignee, priority, deadline

**Risk Score**
- Single Fraunces numeral summarising team health
- Derived from blocker density + task overload signals

**Auth & Security**
- Firebase Auth — Google Sign-In + demo mode (no auth wall)
- HMAC-verified Slack signatures
- PII redaction in transcripts
- Firestore security rules
- Zero API keys in browser — all secrets via Secret Manager + Cloud KMS

**Accessibility**
- WCAG 2.2 AA compliant
- Skip link, visible focus rings, aria-live ticker, role="alert" on blockers
- Reduced-motion support
- 14.8:1 contrast ratio on lime accent

**Infrastructure**
- FastAPI backend on Cloud Run (Python 3.12 + uv)
- Next.js 16 App Router frontend on Firebase Hosting
- Cloud Build CI/CD pipeline (`infra/cloudbuild.yaml`)
- 14 Google Cloud services integrated

### Stack
Next.js 16 · TypeScript · Tailwind · shadcn/ui · FastAPI · Pydantic v2 · Gemini 3 Pro / Flash / Live · Firestore · Firebase Auth · Cloud Run · Cloud Build · Cloud Tasks · Secret Manager · Cloud KMS · Cloud Logging · Calendar API · Firebase Hosting
