# LMNS — Academic Balance & Well-Being Mentoring Marketplace

Prototype of a verified mentoring marketplace for Indonesian higher-education students (S1/S2/S3), built around academic balance and student well-being. Students find mentors through verified credentials, agree on scope before a session, and rate mentors on both academic guidance and psychological safety.

**This repository is greenfield.** Nothing here is derived from an earlier LMNS build; the only inputs are the documents below.

## Read in this order

| Order | Document | What it settles |
|---|---|---|
| 1 | `docs/business_requirement.md` | Business case, segments, BR-01…BR-15, risks, roadmap |
| 2 | `docs/product_requirement.md` | PRD: goals, metrics, journeys, 11 user stories with acceptance criteria |
| 3 | `docs/prototype-scope.md` | Locked prototype decisions, in/out scope, seeded data, Definition of Done, demo script |
| 4 | `docs/DESIGN.md` | Visual direction (Material), typography, motion, anti-patterns |
| 5 | `docs/tokens.css` | Implementation token values consumed by the web app |

## Run it

```bash
npm ci
npm run seed     # deterministic dummy data (apps/api/data/lmns.db)
npm run dev      # API on :3001 + web on :5173, one command
```

- Requires Node.js 24 or newer (the API uses the built-in `node:sqlite`). Nothing else to install, no Docker.
- Reset the demo data at any time with `npm run db:reset`.
- Root checks: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- The web app proxies `/api` to the API, so the browser talks to a single origin. If `:5173` is taken, Vite prints the port it actually used.
- Optional configuration: copy `.env.example` to `.env`. The fee, tier labels, demo OTP and email-domain allowlist are read from there and served to the UI by `GET /api/config`.

### Demo accounts

Sign in with the email only (prototype auth stub, no passwords); the demo OTP is `123456`.

| Email | Role | State |
|---|---|---|
| `rani@ui.ac.id` | Mentee | Verified, pulse done, completed booking awaiting review |
| `bayu@ugm.ac.id` | Mentee | Verified, no bookings |
| `citra@itb.ac.id` | Mentee | Verified, mediation with one-sided agreement |
| `sari@ui.ac.id` | Mentor, Educator | Verified and listed, `Rp 0`, pending booking |
| `adi@ui.ac.id` | Mentor, Premium Educator | Verified, badge issued, reviews present |
| `hendra@ugm.ac.id` | Mentor applicant | Pending admin verification |
| `dewi@unair.ac.id` | Mentor applicant | Rejected with a stated missing item |
| `reviewer@lmns.id` | Admin | Verification queue |

The full dataset (plus six supply-only mentors across six disciplines) is specified in `docs/seed-data.md`.

## Contracts (build against these)

| Document | What it settles |
|---|---|
| `docs/architecture.md` | Stack, layering, error envelope, config surface, server-side gates, how the two apps run together |
| `docs/api-contract.md` | Every endpoint, request/response shape, error code and HTTP status, story coverage matrix |
| `docs/data-model.md` | Tables, keys, relationships, state machines for application, booking/mediation and reviews, privacy matrix |
| `docs/seed-data.md` | Deterministic seed contract, demo accounts, reset semantics |

## Ground rules

- **No inherited code.** Do not import, copy, or "align with" any prior LMNS implementation.
- **Copy claims must be enforceable.** If the prototype cannot enforce a promise, it does not appear in user-facing copy.
- **Well-being data stays private.** No raw pulse, stress, or mood value is ever shown to a mentor or admin, and no score is reflected back to the mentee.
- **Config over constants.** Platform fee, tier labels, and demo OTP come from configuration.
- **No secrets in the repository**, and no real payment, email, or video integration.
