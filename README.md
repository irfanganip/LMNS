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
- If ports are busy, override them without touching `.env`: `PORT=3101 WEB_PORT=5175 API_PROXY_TARGET=http://localhost:3101 npm run dev` (the web app follows `WEB_PORT` and proxies `/api` to `API_PROXY_TARGET`).

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

### Five-beat demo (docs/prototype-scope.md §7)

Run the beats in order against a freshly seeded database (`npm run db:reset && npm run dev`).

1. **Trust is verifiable** — visit `/`, filter the tier chips to *Premium Educator Mentor* (two mentors remain), open Dr. Adi Prasetyo. The profile shows the tier, the platform fee served by `GET /api/config`, the badge with its href, and the Scopus/Scholar/LinkedIn links. `hendra@ugm.ac.id` is still pending verification and does not appear in discovery.
2. **The fee is honest** — sign in as `bayu@ugm.ac.id`, open a mentor, *Ajukan sesi*, fill the intake note, continue to `/booking/:id/pembayaran`. The checkout shows the `Rp 50.000` platform fee, states that it is not the session fee, and blocks payment until the fee disclosure is acknowledged. Paying (mock) issues a receipt `LMNS-2026-####`. Before payment, `GET /api/bookings/:id/thread` returns `402`.
3. **The agreement is the product** — in `/booking/:id/mediasi`, confirm scope, schedule and settlement one item at a time. A single-sided (or partially confirmed) card never produces `SCHEDULED`; `bkg_citra_tono_1` in the seed is the one-sided example and stays `PAID`. After both sides confirm all three items, the booking is `SCHEDULED`.
4. **Supply is vetted** — sign in as `reviewer@lmns.id`, open *Verifikasi*. The queue lists the pending application with its SLA age; the detail shows every evidence link. Approving both updates the status and puts the mentor in discovery (`Hendra` on `/`). Approving an incomplete checklist is refused with `409 BADGE_PRECONDITIONS_UNMET`; `dewi@unair.ac.id` is the rejected example, showing `MISSING_SISTER_ID` and the templated reason.
5. **Well-being has signal** — as `rani@ui.ac.id`, open *Booking saya* (`bkg_rani_adi_1` is completed), submit the dual-axis review plus the mood check. A second submission is refused (`409 REVIEW_ALREADY_SUBMITTED`) and the review screen no longer offers the form. As a visitor, the mentor profile shows *Akademik* and *Kesejahteraan* as two separate averages and never a blended score.

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
