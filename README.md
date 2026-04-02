<div align="center">

```
██╗      █████╗ ██████╗ ██████╗ ██╗██╗  ██╗
██║     ██╔══██╗██╔══██╗██╔══██╗██║╚██╗██╔╝
██║     ███████║██████╔╝██████╔╝██║ ╚███╔╝ 
██║     ██╔══██║██╔══██╗██╔══██╗██║ ██╔██╗ 
███████╗██║  ██║██████╔╝██║  ██║██║██╔╝ ██╗
╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
```

**Laboratory Intelligence & Execution System**

*Deterministic workflows. Immutable data. Zero ambiguity.*

![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=flat-square&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![Hono](https://img.shields.io/badge/Hono-4.x-E36002?style=flat-square)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red?style=flat-square)

</div>

---

## What Is Labrix

SavolaLab is a **Laboratory Information Management System (LIMS)** built specifically for industrial sugar refineries. It replaces paper logbooks, spreadsheet chaos, and disconnected QC systems with a single real-time platform that handles the entire quality lifecycle.

A batch of raw sugar arrives. By the time it leaves as certified white crystals, it has passed through 10+ process stages, each requiring specific chemical tests — Pol, Brix, Colour, Ash, pH, Purity, Moisture, Turbidity, and more. SavolaLab tracks every measurement, every technician, every approval, and every anomaly. Nothing is lost. Nothing can be altered after the fact. Everything is auditable.

**What it replaces:**
- Manual lab notebooks with no version control
- Shared Excel sheets with no access control
- WhatsApp groups for STAT escalations
- Email chains for certificate approvals
- Monthly PDF reports nobody reads

**What it delivers:**
- Real-time sample queue visible to every shift
- Instrument-linked calculations (ICUMSA colour from absorbance)
- Automated workflow execution with step-by-step tracking
- Peer review enforcement at the database level
- Immutable, trigger-protected audit trail
- One-click CSV export for regulatory submissions

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (React 19)                       │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │   Lab    │  │Workflows │  │  Archive/Reports │  │
│  │ Capsule  │  │ Capsule  │  │ Capsule  │  │     Capsule      │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│       │              │              │                │           │
│  ┌────▼──────────────▼──────────────▼────────────────▼────────┐  │
│  │           Zustand Stores + XState Machines                 │  │
│  │         ApiClient (singleton · JWT · retry)                │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │ HTTP / Cookie
┌─────────────────────────────▼────────────────────────────────────┐
│                        HONO API SERVER                           │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │   Auth   │  │ Samples  │  │  Tests   │  │   Notifications  │  │
│  │  Module  │  │  Module  │  │  Module  │  │      Module      │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘  │
│       │              │              │                │           │
│  ┌────▼──────────────▼──────────────▼────────────────▼────────┐  │
│  │            Core: JWT Middleware · RBAC Guards              │  │
│  │            DB Client (pg Pool · Observability)             │  │
│  └──────────────────────────┬─────────────────────────────────┘  │
└─────────────────────────────┼────────────────────────────────────┘
                              │ SQL
┌─────────────────────────────▼────────────────────────────────────┐
│                         POSTGRESQL                               │
│                                                                  │
│   Migrations · Security Triggers · Immutable Audit Log           │
│   Row-level constraints · FK enforcement · Append-only tests     │
└──────────────────────────────────────────────────────────────────┘
```

### Repository Layout

```
savolalab/
│
├── server/                          # Backend (Node.js + Hono)
│   ├── core/
│   │   ├── database/
│   │   │   ├── client.ts            # pg Pool, slow-query logger, observability wrapper
│   │   │   ├── migrations.ts        # Versioned schema definitions (v1–v12)
│   │   │   ├── runner.ts            # Migration executor with per-version transactions
│   │   │   ├── seeds.ts             # Idempotent reference data (roles, admin, lines…)
│   │   │   ├── security.ts          # OTP hashing, DB-level security triggers
│   │   │   ├── events.ts            # createNotification(), createAuditLog()
│   │   │   └── observability.ts     # Error categorisation per SQLite/PG error code
│   │   ├── database.ts              # Init orchestrator: instrument → migrate → trigger → seed
│   │   ├── middleware.ts            # authenticateToken, requireRoles, requirePermission
│   │   └── types.ts                 # UserRole, PermissionFlags, can(), isReviewer()
│   │
│   ├── modules/
│   │   ├── auth/                    # Login, OTP, account provisioning, lockout
│   │   ├── samples/                 # Registration, lifecycle, test templates
│   │   ├── tests/                   # Result entry, update, peer review, deletion block
│   │   ├── workflows/               # Multi-step sequence engine, step execution
│   │   ├── notifications/           # Unread count, overdue detection, mark-read
│   │   ├── audit/                   # Paginated log, client-event write
│   │   ├── archive/                 # Cross-entity historical search + pagination
│   │   ├── operational/             # Production lines, equipment, instruments, inventory
│   │   ├── settings/                # Allowlisted table CRUD, system preferences
│   │   ├── telemetry/               # CPU, memory, uptime, error rate, throughput
│   │   └── stats/                   # STAT request creation and retrieval
│   │
│   └── server.ts                    # App wiring, CORS, security headers, graceful shutdown
│
├── src/                             # Frontend (React 19 + TypeScript)
│   ├── app/
│   │   ├── AppShell.tsx             # Root layout, auth gate
│   │   ├── layout/                  # Header, Sidebar, RightRail (telemetry + notifications)
│   │   ├── router/                  # Lazy-loaded feature router with RBAC check
│   │   └── state/ui.machine.ts      # XState lab view machine
│   │
│   ├── capsules/                    # Self-contained feature domains
│   │   ├── lab/                     # Sample queue, lab bench, ICUMSA calc, history charts
│   │   ├── auth/                    # Login, quick-switch, registration flow
│   │   ├── workflows/               # Execution history, step metrics
│   │   ├── archive/                 # Search UI, CSV export
│   │   ├── dashboard/               # QC stats, trends, plant overview, priority dist.
│   │   ├── notifications/           # Notification centre dropdown
│   │   ├── settings/                # System config editor
│   │   └── audit/ analytics/ …      # Additional feature capsules
│   │
│   ├── core/
│   │   ├── http/client.ts           # ApiClient singleton (retry, JWT injection, 401 logout)
│   │   ├── rbac.ts                  # Tab-level access map per role
│   │   ├── types/                   # Shared type system (samples, tests, workflows, users…)
│   │   └── utils/                   # calculateICUMSA(), PDF generation, safe storage
│   │
│   └── orchestrator/
│       ├── state/app.store.ts        # Active tab, sidebar (persisted)
│       └── state/auth.store.ts       # Current user, JWT token (persisted)
│
├── scripts/                         # Code generation utilities
│   ├── index.ts                     # CLI: gen:structure | gen:types
│   └── generators/                  # generate-structure.ts, generate-types.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Tech Stack

| Domain | Technology | Why |
|---|---|---|
| **Runtime** | Node.js 20+ (ESM) | Native ESM, top-level await, no transpilation overhead |
| **API Framework** | [Hono](https://hono.dev) v4 | Edge-first, zero-overhead routing, first-class middleware |
| **Database** | [PostgreSQL](https://www.postgresql.org/) 15+ via `pg` | ACID transactions, trigger support, production-grade |
| **Auth** | JWT (HS256) + bcrypt + OTP | Stateless sessions, hardware-safe password hashing |
| **Frontend** | [React](https://react.dev/) 19 | Concurrent features, server components ready |
| **Language** | TypeScript 5.8 | Strict mode, template literals, satisfies operator |
| **Build** | [Vite](https://vite.dev/) 6 | Sub-second HMR, optimized production bundles |
| **Styling** | Tailwind CSS v4 | CSS-first config, JIT, zero-runtime |
| **Animation** | Motion v12 (Framer) | Spring physics, layout animations, AnimatePresence |
| **State** | Zustand v5 + XState v5 | Minimal global state + formal state machines for complex UI |
| **Charts** | Recharts v3 | Composable React chart primitives |
| **List Perf** | [TanStack](https://tanstack.com/) Virtual v3 | Virtualized sample queue — handles thousands of rows |
| **Monitoring** | [Sentry](https://sentry.io/) | Exception capture, performance tracing |
| **Storage** | Firebase Storage | Certificate PDF hosting |

---

## Feature Deep-Dive

### 🧪 Lab Bench

The core of the system. When a technician opens a sample, they see every required test pre-populated from stage-specific templates. For each test:

- **Range validation** fires as they type — not on submit. Out-of-range values turn red and surface a domain-specific suggestion ("Check sample dilution or instrument zeroing.")
- **Visual range indicator** shows where the reading sits relative to the operational window with a spring-animated marker
- **Previous results** are fetched per test type and displayed as a sparkline chart with exact values, so the technician can spot trends before finalizing
- **ICUMSA Colour** is a derived test — the technician inputs absorbance, Brix %, and cell length; the calculated colour in IU appears instantly using: `colour = (A × 1000) / (cellLength × (Brix × density / 100))`
- **Notes** per test, expandable inline, attached to the result permanently

### ⚡ STAT Priority System

Three priority levels with different visual treatments across the UI:

| Priority | Colour | Behaviour |
|---|---|---|
| `NORMAL` | Sage green | Standard queue position |
| `HIGH` | Amber | Elevated in sort order |
| `STAT` | Crimson + pulse | Floats to top, pulsing border, animated presence indicator |

STAT samples are sorted before HIGH, which are sorted before NORMAL. Within the same priority, newest first.

### 🔄 Workflow Engine

Workflows are named, versioned test sequences tied to a production stage. Example:

```
Workflow: "White Sugar Full Panel"
Target Stage: White Sugar

Step 1 → Pol          [min: 99.0,  max: 100.0]
Step 2 → Moisture     [min: 0.0,   max: 0.06]
Step 3 → Colour       [min: 0,     max: 45]
Step 4 → Ash          [min: 0,     max: 0.04]
```

When a workflow execution is started for a sample:
1. All steps are created in `PENDING` state
2. As test results are recorded, the engine matches them to pending steps by `test_type`
3. Each matched step transitions to `COMPLETED` with the result value and timestamp
4. When all steps are done, the parent execution automatically closes as `COMPLETED` or `FAILED`

The engine is triggered inside the test creation transaction — it's atomic. If step sync fails, it logs a warning but does not abort the test save.

### 🔒 Data Integrity Stack

Data integrity is enforced at **three independent layers**:

```
Application Layer     →  TypeScript validators, status checks, permission guards
      ↓
API Layer             →  authenticateToken, requireRoles, requirePermission middleware
      ↓
Database Layer        →  PostgreSQL triggers (cannot be bypassed by any application code)
```

The database triggers are the final, unbypassable guarantee:

| Trigger | Table | Event | Effect |
|---|---|---|---|
| `prevent_extra_sample_types` | `sample_types` | `BEFORE INSERT` | Caps at 20 entries |
| `protect_completed_sample` | `samples` | `BEFORE UPDATE/DELETE` | Blocks if status is COMPLETED or APPROVED |
| `protect_completed_test` | `tests` | `BEFORE UPDATE` | Blocks if status is APPROVED |
| `prevent_test_deletion` | `tests` | `BEFORE DELETE` | Always raises + writes audit log |
| `protect_audit_logs` | `audit_logs` | `BEFORE UPDATE/DELETE` | Always raises — log is forever |
| `prevent_employee_delete` | `employees` | `BEFORE DELETE` | Blocks employees with related records |
| `inventory_low_stock_alert` | `inventory` | `AFTER UPDATE` | Creates admin notification when qty ≤ min |

### 🛡️ Authentication & Lockout

```
First Visit                Account Provisioning (3 steps)
────────────               ──────────────────────────────
Select account        →    1. Verify identity
Enter PIN or password →       employee_number + national_id + dob
JWT cookie set (8h)   →    2. Confirm OTP
                              6-digit, 5-minute TTL, bcrypt-hashed
                           3. Set credentials
                              password (min 6 chars) + 4-digit PIN

Login Security
──────────────
Attempt 1–4: increment failed_attempts counter
Attempt 5:   lock account for 30 minutes, set locked_until timestamp
After lockout expires: counter resets on next successful login
On success: counter reset, last_login updated, audit log written
```

Passwords and PINs are hashed with bcrypt at 12 rounds. OTPs are also bcrypt-hashed before storage — brute-forcing the OTP table yields nothing.

---

## Role-Based Access Control

### Permission Matrix

| Role | View Results | Input Data | Edit Formulas | Change Specs | Review Tests |
|---|:---:|:---:|:---:|:---:|:---:|
| `ADMIN` | ✓ | ✓ | ✓ | ✓ | — |
| `HEAD_MANAGER` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `ASSISTING_MANAGER` | ✓ | ✓ | ✓ | ✓ | — |
| `SHIFT_CHEMIST` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `CHEMIST` | ✓ | ✓ | ✓ | ✓ | — |
| `ENGINEER` | ✓ | — | — | — | — |
| `DISPATCH` | ✓ | — | — | — | — |

Only `SHIFT_CHEMIST` and `HEAD_MANAGER` can review (approve/disapprove) test results. This is enforced via `isReviewer()` in `server/core/types.ts` — a type guard that doubles as a runtime check.

### Tab Access

RBAC also governs which application modules each role can access:

| Tab | ADMIN | HEAD_MGR | ASST_MGR | SHIFT_CHEM | CHEMIST | ENGINEER | DISPATCH |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Lab Bench | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| STAT | ✓ | ✓ | ✓ | ✓ | ✓ | — | — |
| Dispatch | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ |
| Workflows | ✓ | ✓ | ✓ | — | — | — | — |
| Analytics | ✓ | ✓ | ✓ | — | — | — | — |
| Plant Intel | ✓ | ✓ | — | — | — | ✓ | — |
| Assets | ✓ | ✓ | ✓ | — | — | — | — |
| Audit | ✓ | ✓ | — | — | — | — | — |
| Settings | ✓ | ✓ | — | — | — | — | — |
| Archive | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## Getting Started

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 15+** — local or hosted (Supabase, Railway, Neon, RDS, etc.)

### 1. Clone & Install

```bash
git clone https://github.com/thisconz/SavolaLab.git
cd savolalab
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# ─── Required ───────────────────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/savolalab
JWT_SECRET=generate-with-openssl-rand-base64-32

# ─── Optional (shown with defaults) ─────────────────────────────────
PORT=3000
NODE_ENV=development
BCRYPT_ROUNDS=12
SLOW_QUERY_MS=50
```

> **Generate a secure JWT secret:**
> ```bash
> openssl rand -base64 32
> ```

### 3. Create the Database

```bash
# Connect to PostgreSQL and create the database
psql -U postgres -c "CREATE DATABASE savolalab;"
```

### 4. Start

```bash
npm run dev
```

On first boot, the server self-initializes:

```
🔍 DB observability layer applied
✔ v1:  Create employees table
✔ v2:  Create users authentication table
✔ v3:  Create OTP codes table
  … 9 more migrations …
✔ v12: Create stat_requests table
✅ Schema up-to-date (version 12)
🔒 Security triggers initialized
🌱 Seed data applied
✅ Database fully initialized
🚀 Server running at http://localhost:3000 [development]
```

### 5. Login

Open `http://localhost:3000` and log in with the seeded admin account:

```
Employee Number : ADMIN
Password        : 1234
PIN             : 1111
```

> ⚠️ **Change these immediately.** They exist only for first-boot convenience.

---

## Scripts

```bash
npm run dev            # Hono API + Vite HMR, unified on PORT
npm run build          # Production build (client → dist/)
npm run start          # Serve production build
npm run lint           # TypeScript type-check, no emit
npm run format         # Prettier write
npm run check          # lint + prettier --check (CI gate)
npm run gen:structure  # Output project tree → scripts/output/projectStructure/
npm run gen:types      # Collect *.types.ts files → scripts/output/typesStructure/
```

---

## API Reference

> All routes require `Authorization: Bearer <token>` or `token` cookie unless marked **Public**.

### Auth  `/api/auth`

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/users` | Public | Active user list for login screen |
| `POST` | `/verify-employee` | Public | Identity check → OTP dispatch |
| `POST` | `/confirm-otp` | Public | Validate 6-digit OTP |
| `POST` | `/setup-credentials` | Public | Set password + PIN for new account |
| `POST` | `/login` | Public | Authenticate → set `httpOnly` JWT cookie |
| `GET` | `/me` | Auth | Current user profile |
| `POST` | `/logout` | Auth | Clear auth cookie |

### Samples  `/api/samples`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/` | `view_results` | All samples with test counts + technician name |
| `POST` | `/` | `input_data` | Register new sample |
| `PUT` | `/:id` | `input_data` | Update batch ID, stage, priority, status |
| `GET` | `/:id/tests` | `view_results` | Tests for sample (or stage template stubs) |
| `GET` | `/previous-results` | `view_results` | Historical results by `?stage=&testType=` |

### Tests  `/api/tests`

| Method | Endpoint | Permission | Description |
|---|---|---|---|
| `GET` | `/` | `view_results` | All test results (last 500) |
| `POST` | `/` | `input_data` | Create test result (triggers workflow sync) |
| `PUT` | `/:id` | `input_data` | Update result values, notes, params |
| `POST` | `/:id/review` | Reviewer only | Approve or disapprove |
| `DELETE` | `/:id` | — | **Always blocked** · Logs attempt · Returns `403` |

### Workflows  `/api/workflows`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | All active workflows with their steps |
| `POST` | `/` | Create workflow with steps |
| `POST` | `/:id/execute` | Start execution for `{ sample_id }` |
| `POST` | `/executions/:id/steps/:step_id/start` | Transition step to IN_PROGRESS |
| `POST` | `/executions/:id/steps/:step_id/complete` | Complete step with result |
| `GET` | `/executions/:sample_id` | All executions for a sample with step details |

### Other Endpoints

<details>
<summary><strong>Notifications · Audit · Archive · Operational · Settings · Telemetry · Stats</strong></summary>

**Notifications** `/api/notifications`
```
GET  /                  → notifications + unreadCount
POST /:id/read          → mark one as read
POST /read-all          → mark all as read
POST /check-overdue     → scan for tests pending > 4h, create notifications
```

**Audit Logs** `/api/audit-logs` _(ADMIN / managers only for GET)_
```
GET  /                  → paginated log with filters (employee, action, dates)
POST /                  → write client-side event to audit trail
```

**Archive** `/api/archive`
```
GET  /samples           → search with: sample_id, batch_id, start_date, end_date, status, technician, stage, priority
GET  /tests             → search with: sample_id, batch_id, start_date, end_date, test_type, technician, status
GET  /certificates      → search with: batch_id, start_date, end_date, status
GET  /instruments       → search with: status, start_date, end_date
GET  /audit             → search with: employee_number, action, start_date, end_date, technician
```
All archive endpoints support `?limit=&offset=` pagination (max 200 for samples/tests, 500 for audit).

**Operational** `/api/operational`
```
GET  /production-lines  → all lines
GET  /equipment         → equipment, required: ?line_id=
GET  /instruments       → all instruments
GET  /inventory         → all inventory
GET  /certificates      → all certificates (optional: ?status=)
```

**Settings** `/api/settings`
```
GET  /preferences       → key-value system preferences map
GET  /:table            → read allowed table (allowlist enforced server-side)
POST /:table            → create record
PUT  /:table/:id        → update record
```
Allowed tables: `sample_types`, `process_stages`, `measurement_units`, `test_methods`, `instruments`, `clients`, `notification_rules`, `system_preferences`, `employees`, `production_lines`, `inventory`

**Telemetry** `/api/telemetry`
```
GET  /                  → { cpuLoad, memory, dbSync, uptime, activeUsers, errorRate, throughput, stats }
```

**Stats** `/api/stats`
```
GET  /                  → all STAT requests ordered by urgency then date
POST /                  → create STAT request { department, reason, urgency }
```

**Health**
```
GET  /health            → { status: "ok", uptime, env, timestamp }
```
</details>

---

## Database

### Migration System

Each migration is a versioned, atomic unit. The runner executes them in order, wraps each in a transaction, and records the version in `schema_migrations`. A failed migration halts the boot immediately — no partial schema, ever.

**Adding a migration:**

```typescript
// server/core/database/migrations.ts

{
  version: 13,
  description: "Add calibration_log table",
  up: async (client) => {
    await db.execute(`
      CREATE TABLE calibration_log (
        id            SERIAL PRIMARY KEY,
        instrument_id INTEGER   NOT NULL REFERENCES instruments(id),
        performed_by  TEXT      NOT NULL REFERENCES employees(employee_number),
        result        TEXT      NOT NULL CHECK(result IN ('PASS', 'FAIL', 'ADJUSTED')),
        notes         TEXT,
        performed_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX idx_cal_log_instrument ON calibration_log(instrument_id);
    `);
  },
},
```

Append it. Boot the server. Done.

### Schema Overview

```
user_permissions      roles with 4 boolean permission flags
employees             identity, role, department, email, status
users                 password_hash, pin_hash, status, lockout state
otp_codes             bcrypt-hashed OTPs with TTL, used flag
audit_logs            immutable event log (trigger-protected)
notifications         employee alerts with read state
─────────────────────────────────────────────────────────────────────
samples               batch_id, source_stage, priority, status, tech
tests                 sample→test result with full review chain
─────────────────────────────────────────────────────────────────────
workflows             named test sequences
workflow_steps        ordered steps with min/max thresholds
workflow_executions   sample-workflow binding with status
workflow_step_execs   per-step state, timing, result value
─────────────────────────────────────────────────────────────────────
production_lines      plant line definitions
equipment             assets linked to lines
instruments           measurement devices with calibration dates
inventory             reagents and consumables with low-stock threshold
certificates          batch quality certificates
stat_requests         urgent escalation requests
─────────────────────────────────────────────────────────────────────
sample_types          reference list (max 20, trigger-enforced)
process_stages        production process taxonomy
measurement_units     unit definitions
test_methods          SOP references with formula and range
system_preferences    key-value configuration store
schema_migrations     applied version tracking
```

---

## Frontend Architecture

### The Capsule Pattern

Every feature domain is a **capsule** — a directory that owns its full vertical slice and exposes a clean public API through `index.ts`. Capsules never import from each other directly. Shared infrastructure goes in `core/`. Global state goes in `orchestrator/`.

```
capsules/lab/
├── api/
│   └── lab.api.ts            Typed API calls (getSamples, createTest, reviewTest…)
├── constants/
│   └── validation.constants.ts    Per-test-type range rules
├── hooks/
│   └── useLabSamples.ts      Data fetching hook with loading/error state
├── logic/
│   └── sample.rules.ts       Pure functions: canBeEdited, sortSamples, validateBatchId
├── ui/
│   ├── LabFeature.tsx        Top-level layout for the lab module
│   ├── LabBench.tsx          Test input engine (validation, ICUMSA, history charts)
│   ├── SampleQueue.tsx       Virtualized list with search + priority + status filters
│   ├── SampleCard.tsx        Individual queue item (memoized)
│   ├── SampleDetails.tsx     Detail panel with inline editing
│   └── RegisterSampleModal.tsx   New sample form
└── index.ts                  Public API: export LabFeature, LabApi, useLabSamples
```

### State Architecture

```
┌──────────────────────────────────────────────┐
│              Zustand (global, persisted)     │
│  app.store.ts    → activeTab, isSidebarOpen  │
│  auth.store.ts   → currentUser, token        │
└──────────────────────────────────────────────┘
                        │
┌──────────────────────────────────────────────┐
│              XState (complex UI flows)       │
│  ui.machine.ts   → idle ↔ details ↔ editing  │
│                            ↕                 │
│                       registering            │
│  Prevents impossible states: can't be in     │
│  "editing" and "registering" simultaneously  │
└──────────────────────────────────────────────┘
                        │
┌──────────────────────────────────────────────┐
│           React Local State (component)      │
│  useState / useReducer for transient UI      │
│  (form values, loading flags, modal open)    │
└──────────────────────────────────────────────┘
```

### HTTP Client Design Decisions

The `ApiClient` singleton in `core/http/client.ts` has several deliberate behaviours worth knowing:

**Retry logic is GET-only.** POST/PUT/DELETE requests are never retried. Retrying a POST would create duplicate test results. This is a correctness decision, not an oversight.

**401 triggers logout, 403 does not.** A 401 means the session is expired — log out and re-authenticate. A 403 means the session is valid but the user lacks permission — logging out would be wrong and confusing.

**JWT is injected from the Zustand store**, not a module-level variable. This means the client always uses the latest token even after a quick-switch to a different account.

**Request timeout is 10 seconds** with exponential backoff on retries (up to 3 seconds between attempts).

### Validation Constants

Chemical test validation ranges — the system enforces these both visually and on submission:

| Test | Min | Max | Unit | Step |
|---|---|---|---|---|
| Colour | 0 | 10,000 | IU | 1 |
| Brix | 0 | 100 | % | 0.1 |
| Pol | 0 | 100 | % | 0.01 |
| Purity | 0 | 100 | % | 0.01 |
| Ash | 0 | 5 | % | 0.001 |
| Moisture | 0 | 10 | % | 0.001 |
| pH | 0 | 14 | pH | 0.1 |
| Invert | 0 | 5 | % | 0.01 |
| Turbidity | 0 | 1,000 | NTU | 1 |

---

## Security Hardening

### HTTP Security Headers (all responses)

```
X-Content-Type-Options:    nosniff
X-Frame-Options:           DENY
X-XSS-Protection:          1; mode=block
Referrer-Policy:           strict-origin-when-cross-origin
Permissions-Policy:        camera=(), microphone=(), geolocation=()
Content-Security-Policy:   default-src 'self'; frame-ancestors 'none'; …
```

### Auth Cookie Settings

```
httpOnly: true        # Not accessible via JavaScript
secure:   true        # HTTPS only (production)
sameSite: Strict      # Not sent on cross-site requests (production)
maxAge:   28800       # 8 hours
path:     /
```

### Production Deployment Checklist

- [ ] `JWT_SECRET` is at least 32 random bytes — generate with `openssl rand -base64 32`
- [ ] `NODE_ENV=production` is set
- [ ] Database connection uses TLS (`sslmode=require` in `DATABASE_URL`)
- [ ] Running behind a reverse proxy (nginx/Caddy) with valid TLS certificate
- [ ] Default ADMIN credentials changed after first boot
- [ ] Sentry DSN configured for error monitoring
- [ ] `POST /api/notifications/check-overdue` is called from a cron job (every 30 min recommended), not exposed publicly
- [ ] `BCRYPT_ROUNDS` is at least 12 (default) — increase to 14 for high-security environments
- [ ] Database backups scheduled with point-in-time recovery enabled
- [ ] Firewall rules restrict direct database access to the application server only

---

## Reference Data

### Pre-seeded Sample Types

17 sample types covering the full refining chain:

| Stage | Sample Types |
|---|---|
| **Front-end** | Raw Sugar |
| **Refining** | Screen Melt, Polish Liquor, Fine Liquor |
| **Carbonation** | SAT A/B/C/Out, Milk Lime, Mud |
| **Evaporation** | Evaporator Liquor |
| **Centrifuge** | Wash Water |
| **Filtration** | Filter Supply |
| **Utilities** | Sweet Water, Clean Condensate, Effluent Samples |
| **Finished Goods** | White Sugar, Brown Sugar, Icing Sugar |

### System Preferences Reference

| Key | Default | Description |
|---|---|---|
| `timezone` | `Asia/Riyadh` | Plant timezone for date formatting |
| `production_day_start` | `06:00:00` | Shift day boundary |
| `date_format_db` | `YYYY-MM-DD` | Database date storage format |
| `date_format_ui` | `DD-MMM-YYYY` | Display format |
| `decimal_ph` | `1` | pH result decimal places |
| `decimal_brix` | `2` | Brix result decimal places |
| `decimal_color_liquor` | `1` | Colour (liquor) decimal places |
| `decimal_color_white` | `0` | Colour (white sugar) decimal places |
| `decimal_ash_cao` | `4` | Ash/CaO decimal places |
| `temperature_unit` | `C` | Celsius or Fahrenheit |
| `mass_unit` | `kg` | Mass unit for reports |
| `volume_unit` | `m3/hr` | Flow rate unit |
| `cell_length_white` | `16.3` | Colour photometer cell length — white sugar |
| `cell_length_liquor` | `2.0` | Colour photometer cell length — liquor |
| `wavelength_color` | `420` | Absorbance wavelength (nm) for colour |
| `wavelength_minute_sugar` | `565` | Wavelength for minute sugar starch test |
| `ash_factor` | `C` | Conductivity ash correction factor |
| `hcl_molarity` | `0.5` | HCl concentration for ash calculation |
| `ph_buffer_4` | `4.0` | pH calibration buffer 1 |
| `ph_buffer_7` | `7.0` | pH calibration buffer 2 |
| `ph_buffer_10` | `10.0` | pH calibration buffer 3 |
| `allowed_slope_pct` | `2` | Max acceptable electrode slope deviation % |

---

## Developer Guide

### Adding a Module

**Server side:**

```bash
mkdir server/modules/my-module
touch server/modules/my-module/{service,routes,index}.ts
```

```typescript
// server/modules/my-module/routes.ts
import { Hono } from "hono";
import { MyService } from "./service";
import { authenticateToken } from "../../core/middleware";

const app = new Hono();

app.get("/", authenticateToken, async (c) => {
  return c.json({ success: true, data: await MyService.getAll() });
});

export default app;
```

```typescript
// server/server.ts  (add one line)
import myModuleRoutes from "./modules/my-module/routes";
app.route(`${api}/my-module`, myModuleRoutes);
```

**Client side:**

```bash
mkdir -p src/capsules/my-module/{api,ui}
touch src/capsules/my-module/{index,api/my-module.api,ui/MyModuleFeature}.ts
```

Register in `src/app/router/router.tsx` and add to the sidebar in `src/app/layout/Sidebar.tsx`.

### Adding a Migration

```typescript
// Append to server/core/database/migrations.ts
{
  version: 13,   // next number in sequence
  description: "Short description of what this migration does",
  up: async (client) => {
    await db.execute(`
      -- your DDL here
    `);
  },
},
```

Migrations are applied automatically on next boot. Never edit existing migrations — always append new ones.

### Adding a Chemical Test Type

1. Add to `TEST_TYPES` in `src/core/types/lab.types.ts`
2. Optionally add a validation rule in `src/capsules/lab/constants/validation.constants.ts`
3. Add to `DEFAULT_TESTS` map in `server/modules/samples/service.ts` if it should appear automatically for certain stages

### Running Code Generators

```bash
# Regenerate project directory tree (for documentation)
npm run gen:structure
# → scripts/output/projectStructure/structure.json
# → scripts/output/projectStructure/structure.txt

# Collect all type definition files
npm run gen:types
# → scripts/output/typesStructure/type-files.json
# → scripts/output/typesStructure/type-files.txt
```

---

## Known Constraints & Roadmap Notes

- **OTP delivery** is currently console-logged in development. A production deployment needs an SMS/email gateway wired into `AuthService.verifyEmployee()` — look for the `[DEV OTP]` log line.
- **Certificate generation** uses Firebase Storage for PDF hosting. If running without Firebase, the PDF generation in `core/utils/pdf.util.ts` will fail gracefully but certificates won't have download URLs.
- **The `/check-overdue` endpoint** is intended to be called by an external cron job (e.g. a GitHub Action, a cron on the server, or a managed scheduler). It is not automatically scheduled internally.
- **Analytics, Intelligence, Assets, Dispatch, and STAT feature capsules** have their UI shells in place but are pending full implementation — they render placeholder panels.

---

<div align="center">

---

*Built for the QC Division — Savola Group*

*Precision is not optional when every gram matters.*

</div>