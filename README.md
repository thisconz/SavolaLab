<div align="center">

```
███████╗███████╗███╗   ██╗████████╗██╗  ██╗ █████╗ ██████╗
╚══███╔╝██╔════╝████╗  ██║╚══██╔══╝██║  ██║██╔══██╗██╔══██╗
  ███╔╝ █████╗  ██╔██╗ ██║   ██║   ███████║███████║██████╔╝
 ███╔╝  ██╔══╝  ██║╚██╗██║   ██║   ██╔══██║██╔══██║██╔══██╗
███████╗███████╗██║ ╚████║   ██║   ██║  ██║██║  ██║██║  ██║
╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
```

**Laboratory Intelligence & Execution System**

_Deterministic workflows. Immutable data. Zero ambiguity._

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4.x-E36002?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

</div>

---

## What Is Zenthar

Zenthar is an enterprise-grade **Laboratory Information Management System (LIMS)** purpose-built for industrial sugar refinery quality-control divisions. It provides:

- **End-to-end sample lifecycle management** — registration → testing → validation → certification
- **Real-time dashboards** with SSE-pushed updates, SPC charts, and Cpk/Ppk gauges
- **Role-based access control** across seven permission tiers
- **Workflow automation** engine with step-by-step execution tracking
- **Append-only, immutable audit trail** enforced at the database trigger level
- **Dual database backend** — PostgreSQL in production, PGlite for offline/development

---

## Architecture

```
┌───────────────────────────────────────────────────────┐
│                   React 19 SPA                        │
│  ┌──────────┐ ┌──────────┐ ┌───────────────────────┐  │
│  │ Capsules │ │  Shared  │ │  Core (types/hooks/   │  │
│  │ (features│ │Components│ │   http/rbac/SSE)      │  │
│  └──────────┘ └──────────┘ └───────────────────────┘  │
└─────────────────────────┬─────────────────────────────┘
                          │ HTTP + SSE
┌─────────────────────────▼──────────────────────────┐
│              Hono v4 API Server (Node.js)          │
│  /api/samples  /api/tests  /api/analytics  …       │
│  ┌──────────────────────────────────────────────┐  │
│  │  Modules: auth · samples · tests · workflows │  │
│  │           analytics · archive · telemetry    │  │
│  │           notifications · settings · export  │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────┘
                          │ Pool / PGlite
            ┌─────────────▼──────────────┐
            │  PostgreSQL 15+ / PGlite   │
            │  16 versioned migrations   │
            │  Immutable audit triggers  │
            └────────────────────────────┘
```

### Tech Stack

| Layer          | Technology                                           |
|----------------|------------------------------------------------------|
| Runtime        | Node.js 20+, TypeScript 5.8                          |
| Frontend       | React 19, Vite 6, Tailwind CSS v4, Framer Motion 11  |
| API            | Hono v4, Zod v4 validation                           |
| Database       | PostgreSQL 15+ (production), PGlite (dev/offline)    |
| Auth           | Custom HMAC-SHA256 JWT + Argon2id + OTP              |
| State          | Zustand 5 (client), XState 5 (workflow state)        |
| Charts         | Recharts 2                                           |
| Testing        | Vitest + Testing Library + Playwright (E2E)          |

---

## Project Structure

```
zenthar/
├── server/                    # Hono API server
│   ├── core/
│   │   ├── db/
│   │   │   ├── client.ts      # PostgreSQL pool + PGlite fallback
│   │   │   ├── migrations.ts  # 16 versioned migrations
│   │   │   ├── schema.ts      # Drizzle ORM schema
│   │   │   ├── seeds.ts       # Initial data seed
│   │   │   ├── security.ts    # OTP helpers + DB triggers
│   │   │   ├── events.ts      # Notification / audit helpers
│   │   │   └── runner.ts      # Migration runner
│   │   ├── auth.ts            # better-auth integration (prod)
│   │   ├── cache.ts           # TTL in-memory cache
│   │   ├── database.ts        # Boot-time DB initialization
│   │   ├── logger.ts          # Pino structured logger
│   │   ├── middleware.ts       # JWT auth + RBAC middleware
│   │   ├── rateLimit.ts       # Token-bucket rate limiter
│   │   └── sse.ts             # SSE event bus
│   ├── modules/               # Feature modules (one per domain)
│   │   ├── analytics/         # SPC charts, Cpk, pass rates
│   │   ├── archive/           # Historical search + export
│   │   ├── audit/             # Immutable audit logs
│   │   ├── auth/              # Login, OTP, JWT, refresh
│   │   ├── certificates/      # CoA generation + approval
│   │   ├── dispatch/          # Shipment & QC release queue
│   │   ├── export/            # Excel (xlsx) exports
│   │   ├── notifications/     # Push + overdue detection
│   │   ├── operational/       # Lines, equipment, instruments
│   │   ├── realtime/          # SSE stream endpoint
│   │   ├── samples/           # Sample CRUD + lifecycle
│   │   ├── settings/          # Registry tables CRUD
│   │   ├── stats/             # STAT priority requests
│   │   ├── telemetry/         # System health metrics
│   │   ├── tests/             # Test result CRUD + review
│   │   └── workflows/         # Workflow engine
│   └── server.ts              # Entry point + route wiring
│
├── src/                       # React SPA
│   ├── app/                   # Shell, layout, router
│   │   ├── AppShell.tsx
│   │   ├── layout/            # Header, Sidebar, RightRail
│   │   └── router/            # Feature-based lazy router
│   ├── capsules/              # Feature modules (vertical slices)
│   │   ├── analytics/
│   │   ├── archive/
│   │   ├── assets/
│   │   ├── audit/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── dispatch/
│   │   ├── intelligence/
│   │   ├── lab/               # Core lab bench + sample queue
│   │   ├── notifications/
│   │   ├── settings/
│   │   ├── stat/
│   │   └── workflows/
│   ├── core/                  # Cross-cutting concerns
│   │   ├── constants/         # Shared literals (no magic strings)
│   │   ├── hooks/             # useSSE, useDebounce
│   │   ├── http/              # ApiClient singleton
│   │   ├── providers/         # RealtimeProvider (SSE context)
│   │   ├── rbac.ts            # Role → tab permission matrix
│   │   ├── telemetry/         # Client-side logging utility
│   │   └── types/             # Domain type barrel
│   ├── lib/                   # Thin library re-exports
│   │   ├── clsx.ts            # className utility
│   │   ├── motion.tsx         # framer-motion re-export
│   │   └── recharts.tsx       # recharts re-export
│   ├── orchestrator/          # Global state
│   │   └── state/
│   │       ├── app.store.ts   # Active tab, sidebar
│   │       └── auth.store.ts  # Current user, token
│   └── shared/
│       ├── components/        # Reusable UI primitives
│       └── schemas/           # Zod schema contracts
│
├── tests/
│   ├── e2e/                   # Playwright end-to-end specs
│   ├── unit/                  # Vitest unit tests
│   └── setup.ts               # Global test setup
│
├── scripts/                   # Dev tooling scripts
└── .env.example               # Environment template
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL** 15+ *(optional — PGlite is used automatically if `DATABASE_URL` is not set)*

### 1 — Install dependencies

```bash
npm install
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required in production; optional in development (PGlite fallback is used)
DATABASE_URL=postgres://user:password@localhost:5432/zenthar

# Required in production; any string works in dev
JWT_SECRET=your-secret-here

# Optional
LOG_LEVEL=info
NODE_ENV=development
```

### 3 — Start the development server

```bash
npm run dev
```

This starts the unified Hono server on **http://localhost:3000** with:
- React SPA served via Vite middleware (HMR enabled)
- REST API at `/api/*`
- SSE stream at `/api/realtime/stream`

On first boot, migrations run automatically and seed data is inserted including three default accounts:

| Employee # | Password         | PIN  | Role        |
|-----------|-----------------|------|-------------|
| `ADMIN`   | `Z3nthar!2025`  | 1111 | Admin       |
| `CHEMIST` | `Z3nthar!2025`  | 1111 | Chemist     |
| `SHIFT01` | `Z3nthar!2025`  | 1111 | Shift Chemist |

> ⚠️ Change all default credentials before deploying to production.

### 4 — Production build

```bash
npm run build
NODE_ENV=production npm start
```

---

## Testing

```bash
# Unit + integration tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# End-to-end (Playwright)
npm run test:e2e
```

Test suites:

| File | Coverage |
|------|----------|
| `tests/unit/auth.test.ts`         | JWT signing, HMAC verification, token type enforcement |
| `tests/unit/archive.test.ts`      | Dynamic SQL builder, placeholder ordering |
| `tests/unit/rbac.test.ts`         | Role → tab permission matrix |
| `tests/unit/calculations.test.ts` | ICUMSA colour calculation |
| `tests/e2e/lab-workflow.spec.ts`  | Full registration → testing → review flow |

---

## Key Features

### Sample Lifecycle
```
REGISTERED → PENDING → TESTING → VALIDATING → COMPLETED / APPROVED
```
Transitions are tracked, audited, and broadcast via SSE to all connected clients.

### Immutable Data Guarantee
Database triggers enforce:
- Tests cannot be deleted (attempt is logged to `audit_logs`)
- Completed/approved samples and tests cannot be modified
- Audit logs cannot be updated or deleted
- OTPs are single-use and time-limited (5–10 min)

### Real-time Updates
All state changes (new sample, test submitted, review completed, STAT request) are pushed over a single SSE connection per user. The frontend uses debounced handlers to coalesce rapid events.

### Role-Based Access Control

| Role | Dashboard | Lab | STAT | Dispatch | Analytics | Settings | Audit |
|------|:---------:|:---:|:----:|:--------:|:---------:|:--------:|:-----:|
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Head Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Assisting Manager | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | – |
| Shift Chemist | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Chemist | ✓ | ✓ | ✓ | ✓ | – | – | – |
| Engineer | ✓ | – | – | – | – | – | – |
| Dispatch | ✓ | – | – | ✓ | – | – | – |

---

## Database Migrations

Migrations are versioned integers running in order. New migrations are appended to `server/core/db/migrations.ts`:

```ts
{
  version: 17,
  up: async (client) => {
    await client.execute(`ALTER TABLE samples ADD COLUMN ...`);
  },
}
```

The runner acquires a Postgres advisory lock before applying, making it safe to run on multi-instance deployments simultaneously.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Prod only | — | PostgreSQL connection string |
| `JWT_SECRET` | Prod only | `insecure-dev-secret` | HMAC signing key |
| `BETTER_AUTH_SECRET` | Optional | same as JWT_SECRET | better-auth signing key |
| `LOG_LEVEL` | No | `info` | Pino log level (`debug`/`info`/`warn`/`error`) |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `VITE_SENTRY_DSN` | No | — | Sentry DSN for error tracking |
| `VITE_ZENTHAR_VERSION` | No | — | Displayed in UI footer |

---

## Contributing

1. Branch off `main` — `git checkout -b feat/your-feature`
2. Run `npm run check` before committing (TypeScript + Prettier)
3. Add or update unit tests for any logic change
4. Open a pull request with a clear description of what changed and why

---

## License

Proprietary — All rights reserved. See `LICENSE` for details.