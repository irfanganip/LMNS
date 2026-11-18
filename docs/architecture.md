# Architecture

LMNS prototype — how the system is put together, where each rule lives, and what the frontend and backend may rely on. Companion documents: `docs/api-contract.md`, `docs/data-model.md`, `docs/seed-data.md`.

**Status:** delivered with the scaffold (S1). `apps/api` currently implements `/api/health`, `/api/config`, the error envelope, the bootstrap schema and the deterministic seed. The backend task (S2) implements the rest of `docs/api-contract.md` inside this structure; the frontend task (S3) consumes it.

## 1. Stack decision

| Layer | Choice | Why this and not something else |
|---|---|---|
| Runtime | Node.js 24 LTS (`engines: >=24`) | One language for API and web. Node 24 ships `node:sqlite`, so the database needs no native build step. |
| Language | TypeScript, strict, ESM (`"type": "module"`) | Types are the cheapest contract enforcement we have with two teams (API/web) building in parallel. |
| API framework | Express 5 | Boring, widely understood, tiny surface for ~45 endpoints. Express 5 routes async errors to the error handler, so no `try/catch` wrapper is needed in every handler. Nest/Fastify would buy structure we do not need at prototype size. |
| Persistence | SQLite via `node:sqlite` (`DatabaseSync`), single file, hand-written SQL | Zero services, zero Docker, zero ORM codegen, and `npm ci` never compiles a native addon — the clean-clone path is the acceptance criterion. Hand-written SQL keeps the schema visible in `apps/api/src/db/schema.sql`. |
| Validation | Zod at the HTTP boundary | One place to reject bad input; schemas double as the executable half of `docs/api-contract.md`. |
| Web | Vite 6 + React 19 | Fast dev server, static build, no SSR requirement for a demo. |
| Lint/format | ESLint 9 flat config + typescript-eslint + Prettier | Root-level `npm run lint` covers both apps. |
| Tests | `node:test` + `node --import tsx` | No test runner dependency; tests boot the real Express app on port 0 and use `fetch`. |
| Package manager | npm workspaces | Already present, no extra tooling. |
| Auth | Demo session stub (see §5) | An auth provider would add a service and secrets; the prototype only needs a role-scoped session. |
| Payments / email / video | Mocked at the API boundary | Prototype scope D8, D3, and out-of-scope list. |

Deliberate non-choices: no Prisma/Drizzle (native engines and codegen slow the clean-clone path), no Docker, no monorepo build orchestrator (npm workspaces plus `concurrently` is enough at two packages), no CSS framework (the design task supplies tokens and components).

> Node module caveat: `node:sqlite` still emits an `ExperimentalWarning` on Node 24. It is stable enough for a demo, is part of the runtime, and imposes no install cost. Do not replace it with a native driver without checking `npm ci` on a clean machine.

## 2. Repository layout

```
.
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config.ts          # env → typed config (single source for product variables)
│   │   │   ├── app.ts             # createApp(db): routes, 404, error handler
│   │   │   ├── index.ts           # boot: open db, migrate, listen
│   │   │   ├── db/                # schema.sql, connection, seed, reset
│   │   │   └── http/errors.ts     # AppError + error envelope
│   │   └── test/                  # node:test suites against the real app
│   └── web/
│       ├── src/                   # React app; consumes docs/tokens.css
│       └── vite.config.ts         # dev server + /api proxy
├── docs/                          # product inputs + the three contracts
├── package.json                   # workspaces + root scripts
├── tsconfig.base.json             # shared compiler options
├── eslint.config.js
└── .env.example
```

Layering inside `apps/api` (added by S2, kept even if thin):

```
routes/       HTTP only: parse, authorize, call a service, serialize, map AppError
services/     rules and gates; no Express types, no SQL
repos/        SQL statements; return plain rows
db/           schema.sql, connection helpers, seed
```

Rules of the boundary:

- A route never runs SQL; a repo never sets an HTTP status.
- Gates (§6) live in services, not in React components. The UI may explain a gate, but the API must reject the request.
- Every mutating endpoint validates its body with a Zod schema and is idempotent or safely retryable where `docs/api-contract.md` says so.

## 3. HTTP conventions

- Base path `/api`. JSON in, JSON out; `Content-Type: application/json`.
- Timestamps are ISO-8601 UTC strings (`2026-11-01T00:00:00.000Z`). Durations are minutes.
- Money is an integer number of Indonesian rupiah (`50000`), never a float, never formatted on the server. The web app formats with `Intl.NumberFormat('id-ID')`.
- JSON field names are `camelCase`; SQL columns are `snake_case`. Mapping happens in repos/routes.
- Enumerations are `UPPER_SNAKE_CASE` (`EDUCATOR_PREMIUM`, `PENDING_REVIEW`). Tier display labels are **not** enums — they come from config (§4).
- Lists are paginated: `page` (1-based, default 1), `pageSize` (default 12, max 50). Responses: `{ items, page, pageSize, total }`.
- Demo auth: `Authorization: Bearer <token>`; missing or unknown token → `401 UNAUTHENTICATED`.

## 4. Error contract

Every non-2xx response has exactly this shape:

```json
{
  "error": {
    "code": "EVIDENCE_MISSING",
    "message": "Bukti kredensial belum lengkap.",
    "details": { "missingItems": ["sisterId", "googleScholarUrl"] }
  }
}
```

- `code` is stable and machine-readable; clients branch on it, never on `message`.
- `message` is user-facing Indonesian copy, safe to render.
- `details` is optional and code-specific; its documented shape is part of the contract.
- Implemented by `apps/api/src/http/errors.ts` (`AppError` + `errorHandler`), so a thrown `new AppError(422, 'EVIDENCE_MISSING', …)` already produces the envelope. The full code table is `docs/api-contract.md` §2.

## 5. Identity and authorization (demo)

No auth provider, no passwords, no secrets.

1. `POST /api/auth/login` with `{ email }` returns `{ token, user, profile }` for a **seeded** account. `POST /api/auth/register` creates an unverified mentee and returns the demo OTP; `POST /api/auth/register/verify` returns the first token.
2. Tokens are opaque random strings stored in `sessions` (table exists in the bootstrap schema). They are not signed, not expiring beyond the seed reset, and acceptable only because this is a local demo.
3. Role comes from `users.role` (`MENTEE` | `MENTOR` | `ADMIN`), never from the request body.
4. The persona switcher in the UI is just repeated logins; it must not bypass `EMAIL_NOT_VERIFIED` or any other gate.

This stub is the one place where "prototype" is doing real work. It must stay clearly labelled in the UI (`demoMode`) and must never be described as production authentication.

## 6. Non-negotiable server-side gates

Each gate is enforced in the API and has a failing-path test (S2 owns the tests).

| # | Gate | Enforced where | Error |
|---|---|---|---|
| G1 | A mentee whose email is not verified cannot create a booking | `POST /api/bookings` | `403 MENTEE_NOT_VERIFIED` |
| G2 | A mentor in `PENDING_REVIEW` or `REJECTED` is absent from discovery, facets, and public profile | `GET /api/mentors*` | `404 MENTOR_NOT_LISTED` on the profile |
| G3 | A booking cannot open a mediation thread before the platform fee is paid | `GET /api/bookings/:id/thread`, `POST …/messages` | `402 PAYMENT_REQUIRED` |
| G4 | A booking cannot become `SCHEDULED` until both parties confirmed every alignment item on the current version | alignment confirm service | `409 ALIGNMENT_INCOMPLETE` |
| G5 | One review per completed booking | `POST /api/bookings/:id/review` | `409 REVIEW_ALREADY_SUBMITTED` |
| G6 | Well-being values (pulse answers, intake stress level, mood check) are returned only to the owning mentee | serializers per role | field absent for mentor/admin |
| G7 | Premium badge issued only when training, S3, overseas experience and certificate are all verified | badge service | `409 BADGE_PRECONDITIONS_UNMET` |

## 7. Config surface

Everything product may change is read once in `apps/api/src/config.ts` from environment variables with defaults, and served to the UI by `GET /api/config`. No value below may be duplicated as a literal in React.

| Variable | Default | Consumed by | Notes |
|---|---|---|---|
| `PORT` | `3001` | API | Express listen port. |
| `DATABASE_PATH` | `./data/lmns.db` (relative to `apps/api`) | API, seed | Gitignored. |
| `PLATFORM_FEE_IDR` | `50000` | checkout, receipt, `/api/config` | Scope D4 placeholder. Integer rupiah. |
| `DEMO_OTP` | `123456` | registration/OTP verify | Fixed OTP for every account; no email is sent (D3). |
| `TIER_LABELS` | `{"BASIC":"Basic Mentor","EDUCATOR_STANDARD":"Educator Mentor","EDUCATOR_PREMIUM":"Premium Educator Mentor"}` | `/api/config`, every tier surface | JSON object; missing keys fall back to the default label. Tier **keys** are code and stay fixed (D2). |
| `ALLOWED_EMAIL_DOMAINS` | `ac.id,edu` | registration | Comma-separated suffix allowlist; `ui.ac.id` matches `ac.id`. |
| `NODE_ENV` | `development` | API | `production` blocks `db:reset`. |
| `WEB_PORT` | `5173` | Vite | Vite increments if the port is taken; watch its startup line. |
| `API_PROXY_TARGET` | `http://localhost:3001` | Vite proxy | Only needed if `PORT` is changed. |

There are no secrets in this project. `.env.example` documents every variable; `.env` is gitignored.

## 8. How the two apps run together

```bash
npm ci          # workspace install, no native builds
npm run seed    # deterministic SQLite data at apps/api/data/lmns.db
npm run dev     # concurrently: API on :3001, Vite on :5173
```

- Vite proxies `/api/*` to `http://localhost:3001` (`apps/web/vite.config.ts`), so the browser only talks to one origin and no CORS configuration is needed.
- `apps/api/src/index.ts` applies the idempotent schema on every boot, so `npm run dev` works even before `npm run seed` (the shell then says the database is unseeded).
- `GET /api/health` reports process + database state and row counts; the web shell renders it. That round trip is the proof the halves are connected.
- Production-ish path: `npm run build` compiles the API to `apps/api/dist` and bundles the web to `apps/web/dist`; `npm run start -w @lmns/api` serves the API from the built output. Serving `apps/web/dist` is out of scope for the prototype.
- `npm run db:reset` deletes the SQLite file and reseeds — the single reset command the demo script assumes.

## 9. Testing strategy

- Gate tests (G1–G7) are the contract's teeth; each needs a request that must fail and an assertion on the exact `error.code`.
- Happy path per story: one test per user story in `docs/prototype-scope.md` §2, using seeded accounts (`docs/seed-data.md`).
- Tests run against `:memory:` SQLite with the real schema and seed fixtures; no network, no timers beyond Node's own.
- `npm test` at the root must pass before any stage hand-off.

## 10. Decisions taken where BRD/PRD were ambiguous

| Ambiguity | Decision | Reason |
|---|---|---|
| Session fee collection | No money moves in the prototype. Checkout charges only the platform fee; session fee/settlement is recorded in the alignment card as an agreed amount and method. | D5/D6/D8 and BR-15: settlements are direct, escrow out of scope. |
| "Notification/email deep link" (US 5.1, US 5.2) | In-app notification rows only (`GET /api/notifications`), plus a review prompt available from the booking record. No email service. | Email delivery is explicitly out of scope; the AC needs a trigger surface, not a transport. |
| Review prompt timing (+1 hour) | `reviewEligibleAt = completedAt + 60 min`, computed server-side; the API returns it and rejects earlier submissions. | AC says "1 hour after completion"; the prototype cannot wait in a cron, so eligibility is a timestamp comparison. |
| Premium vs. standard comparison (US 4.2) | Perk list comes from the mentor's actual tier and verified data; perks that are not true for that mentor are returned as `included: false` with a reason, not hidden. | AC: "unavailable perks are not shown as included"; BR-12 needs the comparison to be honest. |
| Tier vocabulary in URLs/queries | Query accepts tier keys (`BASIC`, `EDUCATOR_STANDARD`, `EDUCATOR_PREMIUM`); UI labels come from config. | D2 fixes keys as code and labels as copy. |
| "Educator Free-Marketplace" naming in the PRD | Maps to `EDUCATOR_STANDARD` (session fee `Rp 0`, still pays the platform fee). | PRD uses both names for one tier; scope D2 locks the vocabulary. |
| OTP expiry/reuse | Demo OTP accepted once per issued challenge, 15-minute expiry, resend limited to 3 per 15 minutes per email. | AC requires expired/reused OTP errors and rate-limited resend. |
| Mentor evidence authenticity | Links and file metadata only; no automated SISTER/Scopus/ORCID check. The reviewer decides. | Out of scope §3 (no registry integration). Uploads are recorded as file metadata; no binary storage service in the prototype. |
| Admin concurrency | Decisions are conditional updates on the application's current status; the second admin receives `409 APPLICATION_ALREADY_DECIDED`. | AC: "two admins cannot approve the same application twice". |
| "Verified mentor" definition | `users.email_verified_at` set **and** application `APPROVED`; only then a `mentor_profiles` row is `APPROVED` and listed. | BR-04/BR-07 + G2. |
| Well-being pulse visibility | Stored per submission (history retained), never returned on any mentor/admin endpoint; matching uses the latest row. | US 1.2 AC and G6. |

## 11. What this scaffold deliberately does not implement

- Business endpoints beyond health/config (S2), UI screens beyond the shell (S3).
- Uploaded binary storage, real payment gateway, email, video integration.
- Rate limiting beyond the OTP counter, CSRF, password storage, audit export.
- The full `docs/data-model.md` schema: the bootstrap file covers identity, domains, sessions and pulses; S2 extends `schema.sql` with the remaining tables. Keeping the initial migration small avoids freezing details before the contract is read.

Known dev-only advisory: `npm audit` currently reports high-severity ReDoS advisories in `picomatch`/`vite`/`typescript-eslint` transitive dev dependencies with no patched version published. They affect build tooling only, are not shipped in the API bundle, and are tracked for upgrade; no runtime dependency is affected.
