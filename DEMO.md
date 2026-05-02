# Pulse — 60-second demo script

> Use Chrome desktop. Allow microphone when prompted.

## Beats

**0–6s · Hero**
Open `https://pulse-web-xxx.run.app/` (live URL below).
Read tagline aloud: *"Speak it. Ship it. See it."*
Point at the **live ticker** scrolling at the bottom — "every team voice update streams across the dashboard like a stock tape, this is the signature element."

**6–12s · Sign-in flow**
Click **Sign in** → land on workspace (demo mode, no auth wall).
Note the asymmetric editorial layout: **Bloomberg terminal × literary magazine.**

**12–24s · The mic orb**
Hover the breathing **lime mic orb** at the bottom-center. Press it (or `⌘ + ⇧ + Space`).
Speak: *"I'll ship the new auth flow today, blocked on getting the staging build green, jules needs final copy by 3pm."*
The waveform reacts. Live caption appears in big italic Fraunces.

**24–36s · Extraction**
Hit **Stop & extract**. Pulse calls Gemini → tasks materialise as lime-bordered chips on the right rail with priority + confidence score.

**36–48s · Visibility**
Close overlay. Show:
- **Kanban board** — drag a card across columns (rotates 2-3°, glows lime on drop)
- **Blocker graph** (right) — d3 force layout, nodes pulsing, **coral edges = blocked**
- **Risk score** card — single big Fraunces number

**48–60s · Wrap**
Tagline + URL + "Built with Gemini 3 Pro/Flash/Live, Firebase, Cloud Run, Firestore. PromptWars × Build with AI 2026."

## URLs

- **Live demo** : `https://pulse-web-xxx.run.app`
- **API health** : `https://pulse-api-okfjjkn4za-uc.a.run.app/health`
- **Repo** : `https://github.com/<you>/TeamColab`

## What to emphasise to judges

| Eval criterion | Evidence |
|---|---|
| **UI** | Three-typeface diet (Fraunces / General Sans / JetBrains Mono), single accent, editorial layout, custom cursor on hero |
| **Code quality** | TS strict, Pydantic v2 schemas, ruff/mypy, ESLint flat config |
| **Security** | Prompt-injection guard (PII redact + fenced inputs), HMAC-verified Slack signatures w/ replay protection, security headers, Firestore rules, no API keys in browser |
| **Efficiency** | Gemini Flash for hot path, Pro reserved, prompt caching, async FastAPI, code split lazy d3 |
| **Testing** | pytest (Slack signature, prompt redaction, auth gate, health), Vitest + jest-axe, Playwright + AxeBuilder |
| **Accessibility** | WCAG 2.2 AA target, skip link, focus rings, `aria-live` ticker, `role="alert"` blockers, reduced motion, lime/dark contrast 14.8:1 |
| **Google services (14)** | Gemini 3 Pro, Flash, Live · Firebase Auth · Firestore · Cloud Storage · Cloud Run · Cloud Build · Cloud Tasks · Secret Manager · Cloud KMS · Cloud Logging · Calendar API · Firebase Hosting |

## Fallback if mic fails on stage
Type the standup text directly into a curl call from a terminal and show the JSON response:
```bash
curl -sS -X POST $API/v1/demo/extract \
  -H 'Content-Type: application/json' \
  -d '{"transcript":"I'\''ll ship auth today, blocked on staging build, jules needs final copy by 3"}' | jq
```
