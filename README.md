# Oroom

**Everything comes to you.**

Oroom automatically pulls in your assignments, emails, updates and calendar events, then sorts them into your day. You never type a task: a background agent finds what needs doing, estimates how long it takes, and books time for it on your calendar, adjusting the plan when deadlines or meetings change.

> Status: in development (Milestone 1). Private project.

---

## What it does

- **Pulls in work automatically** from Brightspace (iCal feed), Google Calendar, forwarded emails and uploaded notes/PDFs.
- **Extracts tasks** with a due date and time estimate: plain rules for structured sources, Claude for unstructured ones.
- **Schedules them** into free time before the deadline, splitting long tasks into sessions.
- **Keeps the plan current**: when a deadline moves or a meeting lands on a block, affected tasks move too.
- **Per-source control**: each connection is either `ask` (suggestions wait for approval) or `auto` (scheduled immediately).
- **Focus timer** with planned-vs-actual stats that feed back into future estimates.
- **Pro plan** via Stripe with a 7-day free trial.

---

## Tech stack

| Layer | Tech |
| --- | --- |
| Language | JavaScript (ES modules), JSDoc for editor type hints |
| Frontend | React, Vite, TanStack Query, React Router |
| API | Node.js, Express, Zod, Passport (Google OAuth) |
| Worker | BullMQ on Redis |
| Database | MongoDB Atlas with Mongoose |
| File storage | Cloudflare R2 (presigned uploads) |
| AI | Claude API with structured JSON output, validated by Zod |
| Integrations | Google Calendar API, Brightspace iCal (`node-ical`), inbound email (Postmark/SendGrid), Stripe Billing, Resend |
| Live updates | Server-Sent Events (Redis pub/sub between worker and API) |
| Testing | Vitest, Supertest, Postman + Newman, Playwright |
| Observability | Sentry (web, API, worker), Pino logs, PostHog, Bull Board |
| Infra | Docker Compose (local), GitHub Actions (CI), Vercel/Cloudflare Pages (web), Render/Railway (API + worker) |

---

## Architecture

Two Node processes share one codebase:

- **API** handles requests and must answer fast: auth, CRUD, the day view, approving suggestions, verifying webhooks. Webhooks only verify, record and enqueue.
- **Worker** does anything slow or external: fetching sources, AI extraction, scheduling, writing to Google Calendar, sending email.

They communicate only through Redis queues. The worker publishes events to Redis pub/sub, and the API forwards them to the browser over SSE.

```
Web app ──HTTPS──▶ API (Express) ──enqueue──▶ Redis + BullMQ ──jobs──▶ Worker
   │                  │  ▲                                              │
   │ presigned        │  └── webhooks (Stripe, inbound email,           ├──▶ Google Calendar, Claude,
   ▼ upload           │       Google push)                              │    Brightspace, Stripe, Resend
Cloudflare R2         └──────────── MongoDB Atlas ◀─────────────────────┘
```

### Ingestion pipeline (shared by every source)

1. Connector fetches raw items and upserts into `sourceItems` by `externalId`.
2. Unchanged `rawHash` → stop. Changed and already a task → change flow.
3. Extract: rules for structured sources, Claude + Zod for email/notes (1 retry, then dead letter).
4. Estimate minutes by kind, adjusted by the user's planned-vs-actual history.
5. Create a suggestion; if the connection is `auto`, approve and schedule immediately.

### Scheduling engine

Free slots = working hours − calendar events − Oroom sessions − 10 min buffers. Place in the earliest slot before the due date, leaving the last 24 h clear when possible. Tasks over 2 h split into 60–90 min sessions. Nothing fits → mark `unscheduled` and flag it, never double-book. Oroom only moves events it created (`ownedByOroom`).

---

## Repo structure

```
oroom/
├── apps/
│   ├── web/          # React + Vite frontend
│   ├── api/          # Express REST API, webhooks, SSE
│   └── worker/       # BullMQ processors
├── packages/
│   └── shared/       # Shared Zod schemas, JSDoc typedefs, constants
├── postman/          # Postman collection + environments (run in CI with Newman)
├── docker-compose.yml
├── .github/workflows/ci.yml
└── pnpm-workspace.yaml
```

---

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker Desktop

### Setup

```bash
git clone <repo-url> oroom
cd oroom
pnpm install
cp .env.example .env      # fill in the values below
docker compose up -d      # MongoDB + Redis
pnpm dev                  # web, api and worker in watch mode
```

- Web: http://localhost:5173
- API: http://localhost:3000/api/v1
- Bull Board: http://localhost:3000/admin/queues (dev only)

### Environment variables

```bash
# Core
NODE_ENV=development
PORT=3000
WEB_URL=http://localhost:5173
MONGODB_URI=mongodb://localhost:27017/oroom
REDIS_URL=redis://localhost:6379
SESSION_SECRET=
ENCRYPTION_KEY=            # 32-byte base64, used for AES-256-GCM on tokens and feed URLs

# Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/v1/auth/google/callback
GOOGLE_WEBHOOK_URL=        # public URL for calendar push (use a tunnel like ngrok in dev)

# AI
ANTHROPIC_API_KEY=
AI_MOCK=true               # true = use the mock client (no API cost) in dev/tests

# Storage
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=oroom-notes

# Email
INBOUND_EMAIL_DOMAIN=      # e.g. in.oroom.app
INBOUND_WEBHOOK_SECRET=
RESEND_API_KEY=

# Billing
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO_MONTHLY=

# Observability
SENTRY_DSN=
POSTHOG_KEY=
```

### Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run web, API and worker in watch mode |
| `pnpm build` | Build all apps |
| `pnpm lint` | ESLint across the repo |
| `pnpm test` | Vitest unit + Supertest API tests |
| `pnpm test:api` | Newman run of the Postman collection |
| `pnpm test:e2e` | Playwright end-to-end tests |

---

## Data model

| Collection | Purpose |
| --- | --- |
| `users` | Profile, timezone, working hours, plan, Stripe customer |
| `connections` | Connected sources, mode (`ask`/`auto`), encrypted tokens or feed URL, sync cursor |
| `sourceItems` | Raw items from sources, keyed by `externalId`, with `rawHash` for change detection |
| `suggestions` | Found tasks awaiting approval (`pending`, `approved`, `skipped`) |
| `tasks` | Tasks and their scheduled sessions (each with a `calendarEventId`) |
| `calendarEvents` | Mirrored calendar events; `ownedByOroom` marks blocks Oroom may move |
| `timerSessions` | Focus timer history for planned-vs-actual |
| `notes` | Uploaded notes, R2 key, extracted text |
| `activity` | The "while you slept" log (TTL 90 days) |
| `webhookEvents` | Processed webhook IDs for idempotency (TTL 30 days) |

Every document has `userId`, and every index starts with it.

---

## API overview

Base path: `/api/v1`. JSON, session cookie auth, Zod-validated bodies, errors as `{ error: { code, message, details } }`, cursor pagination (`?cursor=&limit=`).

- **Auth:** `GET /auth/google`, `GET /auth/google/callback`, `POST /auth/logout`
- **Me:** `GET /me`, `PATCH /me`
- **Connections:** `GET /connections`, `POST /connections/brightspace`, `PATCH /connections/:id`, `DELETE /connections/:id`, `POST /connections/:id/sync`
- **Suggestions:** `GET /suggestions?status=pending`, `POST /suggestions/:id/approve`, `POST /suggestions/:id/skip`
- **Tasks:** `GET|POST /tasks`, `PATCH|DELETE /tasks/:id`
- **Day view:** `GET /today?date=`
- **Notes:** `POST /notes`, `GET /notes`, `GET /notes/:id`
- **Timer:** `POST /timer/start`, `POST /timer/stop`, `GET /stats/estimates`
- **Activity:** `GET /activity?since=`
- **Billing:** `POST /billing/checkout`, `POST /billing/portal`
- **Live:** `GET /events` (SSE)
- **Webhooks:** `POST /webhooks/stripe`, `POST /webhooks/inbound-email`, `POST /webhooks/google-calendar`

---

## Background jobs

| Queue | Trigger | Notes |
| --- | --- | --- |
| `ingest` | Connector fetch, inbound email, note upload | Deterministic job IDs for idempotency |
| `extract` | Unstructured items | Rate-limited to Claude; 2 retries then dead letter |
| `schedule` | Approve, auto-approve, change flow | One job per user at a time (lock) |
| `sync-brightspace` | Every 30 min per connection | Conditional GET; 304 ends the job |
| `sync-calendar` | Google push webhook, daily channel renewal | Incremental via `syncToken`; 410 → full resync |
| `notify` | 7:00 local morning summary, trial emails | Resend |

---

## Conventions

- **Modern JavaScript**: ES modules (`"type": "module"`), `async`/`await`, no CommonJS `require`. Use `.js` for Node code and `.jsx` for React components.
- **Shared shapes live in one place**: Zod schemas in `packages/shared` are the source of truth for every request, webhook and AI payload. Derive JSDoc `@typedef`s from them so the editor autocompletes.
- **Validate at the edges**: every request body, every webhook payload and every AI response goes through Zod.
- **Always scope by user**: every repository function takes `userId` first.
- **Webhooks ack fast**: verify signature → record event ID → enqueue → return 200.
- **Never move what we don't own**: only calendar events with `ownedByOroom: true` are changed by the scheduler.
- **Secrets never in code**: tokens and feed URLs are encrypted at rest; keys come from env vars.
- **Commits**: small and focused, Conventional Commits (`feat:`, `fix:`, `chore:`).
- **Tests**: new endpoints get a Supertest test and a Postman request; AI calls are mocked in tests.

---

## Roadmap

### Milestone 1: classes and calendar, automatic (~90 h)
- [ ] Monorepo, Docker Compose, ESLint, Prettier
- [ ] GitHub Actions CI
- [ ] Express skeleton: errors, Zod, Pino, Sentry, health check
- [ ] Mongoose models and indexes
- [ ] Google OAuth, encrypted tokens, refresh
- [ ] Tasks CRUD + Postman/Newman
- [ ] Google Calendar sync (full, incremental, push)
- [ ] Brightspace iCal import + repeatable sync + ingestion pipeline (rules only)
- [ ] Scheduling engine v1
- [ ] `/today`, `/suggestions`, ask vs auto
- [ ] Deploy; start Google OAuth verification

### Milestone 2: the agent (~55 h)
- [ ] Queues split by concern, dead letters, Bull Board
- [ ] Claude extraction with Zod validation
- [ ] Note uploads to R2 + PDF text extraction
- [ ] Inbound email
- [ ] Change flow (moved deadlines, conflicts, removed items)
- [ ] SSE live updates
- [ ] Activity log

### Milestone 3: money and polish (~45 h)
- [ ] Timer + planned-vs-actual estimates
- [ ] Session splitting
- [ ] Stripe Checkout, portal, webhooks, plan gating
- [ ] Morning summary + trial emails
- [ ] Rate limits, delete account, privacy policy and terms
- [ ] PostHog funnel + Playwright E2E

### Later
Direct Gmail scanning, Outlook mail and calendar, Canvas, Slack, teams, mobile.

---

## Notes for AI coding assistants

- This project is plain JavaScript (ES modules). Do not add TypeScript files or a build step for the API or worker.
- Read this file and `packages/shared` before writing code; reuse existing Zod schemas and JSDoc typedefs.
- Follow the build order in the roadmap; don't add Milestone 2/3 features early.
- Prefer small, reviewable changes with tests. Run `pnpm lint && pnpm test` before finishing.
- Never commit secrets or real `.env` values. Use `AI_MOCK=true` for anything that would call Claude in tests.
