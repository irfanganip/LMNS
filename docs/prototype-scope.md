# Prototype Scope & Decisions

Product baseline for the LMNS prototype. Source of truth: `docs/business_requirement.md` (BRD) and `docs/product_requirement.md` (PRD), both derived from the client's `user_stories.md`. Where those documents leave a value open, the decision below is the prototype default.

**Status:** greenfield. This repository starts empty; no code, schema, seed data, or design token is inherited from any earlier build.

## 1. Product decisions (locked for the prototype)

| # | Decision | Value | Note |
|---|---|---|---|
| D1 | Repository & layout | `github.com/irfanganip/LMNS`, default branch `main`, monorepo (`apps/api`, `apps/web`, `docs/`) | One history, one PR cadence |
| D2 | Mentor tier vocabulary | `BASIC` / `EDUCATOR_STANDARD` / `EDUCATOR_PREMIUM`; display: **Basic Mentor**, **Educator Mentor**, **Premium Educator Mentor** | Used in code, filters, badges, and copy |
| D3 | Mentee identity | Official campus email + 6-digit OTP | Demo mode returns the OTP in the API response; no email is sent |
| D4 | Platform booking fee | Placeholder `IDR 50.000`, configurable via `PLATFORM_FEE_IDR` | Real amount is a client decision; the prototype must render it from config, never hard-code it |
| D5 | Session fees | Settled directly between mentee and mentor (Educator Standard consultations are `Rp 0`) | No money moves in the prototype |
| D6 | Premium packages | Listed, priced, and bookable; payment simulated | **Escrow is out of prototype scope** |
| D7 | Reviews | Dual-axis (Academic & Research Guidance / Psychological Safety & Well-Being Support) + one-tap mood check | Axes are never blended into one score |
| D8 | Payments | Mock gateway: QRIS / Virtual Account / e-wallet as one provider selector, always succeeds unless a test code forces failure | No real gateway integration |
| D9 | Persistence | SQLite file, deterministic seed script, one-command reset | No external database service |
| D10 | UI language | Bahasa Indonesia for user-facing copy; English for code, docs, and commit messages | Client-facing demo audience is Indonesian |
| D11 | Delivery | `npm run dev` starts API + web locally; published as a shared preview URL | Prototype is a demo, not a hosted service |
| D12 | Non-clinical positioning | No diagnosis, therapy, or crisis-handling claims anywhere in copy or code | Release gate |

## 2. In scope — all 11 user stories

| Story | Surface |
|---|---|
| US 1.1 | Mentee registration (campus domain allowlist), OTP verification, academic profile |
| US 1.2 | Well-being baseline pulse (private, skippable, re-promptable) |
| US 2.1a/b/c | Mentor application wizard — tier selection and evidence, mandatory well-being self-assessment, storefront builder |
| US 2.2 | Premium upgrade — training modules, assessment, certificate upload, badge issuance |
| US 3.1 | Discovery, filters, mentor promotional page, badge display |
| US 4.1 | Booking request, intake note, platform-fee checkout, mediation thread, bilateral alignment card |
| US 4.2 | Premium vs. standard comparison at checkout |
| US 5.1 | Dual-axis post-session review + mood check |
| US 5.2 | Admin verification console — queue, evidence links, approve/reject, badge management |

## 3. Out of scope

- Real payment gateways, escrow, refunds, settlements of any kind.
- Real email delivery, SMS, push notifications, video conferencing.
- Live SISTER / Scopus / ORCID / PDDIKTI API integration — verification is reviewer-driven with evidence links.
- Native mobile apps, offline support, multi-language switcher.
- Production security hardening (real secrets, rate limiting, audit export). The prototype still must not store secrets and must not claim compliance.

## 4. Screen inventory (product level)

UI/UX owns the detailed inventory and state matrix; this is the minimum the prototype must expose.

- **Public:** marketplace/discovery with filters, mentor promotional page, register, verify OTP, sign in.
- **Mentee:** onboarding (academic profile → pulse), booking request + intake, checkout with tier comparison, mediation room + alignment card, my bookings, review + mood check.
- **Mentor:** dashboard, application wizard (evidence → self-assessment → storefront), studio/storefront editor, premium upgrade + training, incoming bookings, mediation room.
- **Admin:** verification queue, application detail with evidence links and decision actions, premium badge management.
- **Shared:** persona switcher for demo accounts, empty/loading/error states for every list and form, 404.

## 5. Seeded dummy data

Deterministic; same data on every reset. Demo OTP is `123456` for every account.

| Account | Role / tier | State to demo |
|---|---|---|
| `rani@ui.ac.id` | Mentee, S1 semester 6 | Verified, pulse completed, one completed booking awaiting review |
| `bayu@ugm.ac.id` | Mentee, S2 | Verified, no bookings — clean discovery path |
| `citra@itb.ac.id` | Mentee, S3 | Verified, booking in mediation with one-sided agreement |
| `sari@ui.ac.id` | Mentor, `EDUCATOR_STANDARD` | Verified and listed, session fee `Rp 0`, one pending booking |
| `adi@ui.ac.id` | Mentor, `EDUCATOR_PREMIUM` | Verified, badge issued, premium packages listed, reviews present |
| `hendra@ugm.ac.id` | Mentor, application pending | Submitted, awaiting admin verification |
| `dewi@unair.ac.id` | Mentor, application rejected | Rejected with a stated missing-evidence reason |
| `reviewer@lmns.id` | Admin/reviewer | Verification queue with two applications |

Marketplace supply: at least 8 listed mentors across disciplines (Computer Science, Public Health, Economics, Law, Education, Engineering) and across all three tiers, with varied languages, formats, and starting rates — enough for filters to return meaningful and empty result sets.

## 6. Definition of Done

1. A clean clone runs with `npm ci && npm run seed && npm run dev`; API and web start without manual steps.
2. Every story in §2 is demoable with the seeded accounts, including the specified failure and empty states.
3. Every value that product may change (platform fee, tier labels, OTP) is read from config, not hard-coded in UI copy.
4. No real payment, email, or video integration; the UI states this where a user could otherwise assume otherwise.
5. Well-being data is private: never rendered to mentors or admins in raw form, never scored or labelled back to the mentee.
6. Keyboard reachable, visible focus, ≥ 4.5:1 text contrast, 44px touch targets, responsive at 360 / 768 / 1440.
7. README run instructions and a five-beat demo script exist and are accurate.
8. API happy-path and gate tests pass; web build passes lint/typecheck.

## 7. Demo script (five beats)

1. **Trust is verifiable** — sign in as a mentee, filter the marketplace to Premium mentors, open a profile, follow the SISTER/Scopus/Scholar links.
2. **The fee is honest** — request a booking, read the intake note, pay the platform fee, see exactly what it buys and what it does not.
3. **The agreement is the product** — in the mediation room, confirm scope, schedule, and settlement one item at a time; the session only schedules when both sides confirm everything.
4. **Supply is vetted** — sign in as the reviewer, open the pending application, see each evidence link and the missing-item flags, approve or reject with a templated reason.
5. **Well-being has signal** — as the mentee, submit the dual-axis review and mood check; as a visitor, see the two ratings rendered separately on the mentor page.
