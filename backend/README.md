# Oroom backend

Express API + BullMQ worker, one codebase, MVC layout. Plain JavaScript (ES modules).

```
backend/
├── config/              # env loading, Mongo/Redis connections, Passport, Sentry/Pino setup
├── models/              # (M) Mongoose schemas: User, Connection, SourceItem, Suggestion, Task,
│                        #     CalendarEvent, TimerSession, Note, Activity, WebhookEvent
├── controllers/         # (C) request handlers: parse → call service → shape response
├── routes/              # Express routers mounted under /api/v1 (+ /webhooks, /events SSE)
├── middlewares/         # auth guard, Zod validation, error handler, rate limits, webhook signature checks
├── validators/          # Zod schemas for request bodies, webhook payloads, AI output
├── services/            # business logic (controllers and job processors both call these)
│   ├── connectors/      #   Brightspace iCal, Google Calendar, inbound email, notes
│   ├── scheduling/      #   free-slot finder, placement, session splitting
│   ├── ai/              #   Claude extraction client + mock client (AI_MOCK)
│   └── integrations/    #   Stripe, Resend, R2 presigned uploads, PostHog
├── jobs/                # worker side
│   ├── queues/          #   BullMQ queue definitions (ingest, extract, schedule, sync-*, notify)
│   ├── processors/      #   one processor per queue
│   └── schedulers/      #   repeatable jobs (30-min Brightspace sync, channel renewal, 7:00 summary)
├── events/              # Redis pub/sub publisher (worker) + SSE broadcaster (API)
├── utils/               # crypto (AES-256-GCM), hashing, pagination, date helpers
├── tests/
│   ├── unit/            # Vitest
│   ├── integration/     # Supertest against the Express app
│   └── fixtures/        # sample iCal feeds, emails, AI responses
├── server.js            # API entry point (to be added)
├── worker.js            # worker entry point (to be added)
├── package.json
└── .env.example
```

In this layout the "view" is JSON: controllers return response bodies and the React app in `../frontend` renders them.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | API in watch mode (reads `.env`) |
| `npm run dev:worker` | Worker in watch mode |
| `npm test` | Vitest + Supertest |
| `npm run test:api` | Newman run of the Postman collection |
| `npm run lint` / `npm run format` | ESLint / Prettier |

Copy `.env.example` to `.env` and fill in values before running.
