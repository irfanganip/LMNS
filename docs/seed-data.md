# Seed Data Contract

`npm run seed` must produce exactly the accounts and states in `docs/prototype-scope.md` §5, identically on every machine and every run. This document is that contract and the checklist for the backend task (S2), whose seed must extend the scaffold's.

## 1. Commands

| Command | Effect |
|---|---|
| `npm run seed` | Creates/updates the SQLite file at `apps/api/data/lmns.db` (or `DATABASE_PATH`) with the full demo dataset. Idempotent: it wipes demo rows and re-inserts them inside one transaction. |
| `npm run db:reset` | Deletes the database file (plus `-wal`/`-shm`) and runs `npm run seed`. This is the single reset command the demo script assumes. |
| `npm run dev` | Applies the idempotent schema on boot; works before a seed, but only the shell renders until the database is seeded. |

The seed refuses to run destructively when `NODE_ENV=production` (`apps/api/src/db/reset.ts`).

## 2. Determinism rules

These are non-negotiable; a reseed must produce byte-identical rows.

1. **No randomness.** No `crypto.randomUUID()`, `Math.random()`, or auto-increment ids in seed data. All ids are the fixed prefixed strings below.
2. **No wall clock.** Every timestamp comes from the module constant `SEEDED_AT = '2026-11-01T00:00:00.000Z'` (or a fixed offset from it, e.g. `SEEDED_AT + 9 days`). Never `new Date()`.
3. **Fixed insertion order.** Arrays are declared in the order listed here, and inserts run in FK-safe order: domains → users → profiles → applications/evidence → mentors → storefronts/packages → training data → bookings → payments → threads/messages → alignment → reviews/moods → notifications. Sorting any `SELECT` that feeds a response must be explicit (`ORDER BY created_at, id`).
4. **One transaction.** Any failure rolls back, so a half-seeded database is impossible.
5. **Ids are stable across resets.** They appear in docs, tests, and demo URLs. Renaming one is a breaking change to the contract.
6. **Config is not seeded into copy.** Fee and OTP are read from config, not from the database, except the `seed_meta` record used by `/api/health` to prove the seed ran.
7. **Locale-independent output.** No `toLocaleString` in the seed; formatting is a UI concern.

Implemented today (`apps/api/src/db/seed.ts`): `institution_domains`, `users`, `mentee_profiles`, `mentors` (`mentor_profiles` in the bootstrap schema), `well_being_pulses`, `seed_meta`. S2 extends the same file/schema for applications, bookings, mediation, reviews, badges and notifications — do not fork a second seed script.

## 3. Accounts (mandatory)

14 accounts. The first eight are the demo cast from `docs/prototype-scope.md` §5.

| id | Email | Role | Required state | Demo beat |
|---|---|---|---|---|
| `usr_rani` | `rani@ui.ac.id` | MENTEE | Verified (S1, semester 6, UI, goals Thesis Anxiety + Research Methodology), pulse completed, **one completed booking awaiting review** | Beat 5: submit the review |
| `usr_bayu` | `bayu@ugm.ac.id` | MENTEE | Verified (S2, UGM), onboarding complete, **no bookings, no pulse** | Beat 1: clean discovery path |
| `usr_citra` | `citra@itb.ac.id` | MENTEE | Verified (S3, ITB), pulse completed, **booking in mediation with one-sided agreement** (only her item confirmations) | Beat 3: finish the alignment card |
| `usr_sari` | `sari@ui.ac.id` | MENTOR | `EDUCATOR_STANDARD`, **APPROVED**, listed, session fee `Rp 0`, **one pending booking** from Rani's flow, alignment partially filled | Beats 2–3 |
| `usr_adi` | `adi@ui.ac.id` | MENTOR | `EDUCATOR_PREMIUM`, **APPROVED**, `LMNS_WELL_BEING_CERTIFIED` badge issued, ≥ 2 packages listed, **reviews present on both axes** | Beat 1 & 5: public profile with dual ratings |
| `usr_hendra` | `hendra@ugm.ac.id` | MENTOR | **Application `PENDING_REVIEW`** (`BASIC`), evidence links complete, submitted 41 h ago (inside SLA), one missing-item flag for the reviewer to triage | Beat 4: approve with all evidence visible |
| `usr_dewi` | `dewi@unair.ac.id` | MENTOR | **Application `REJECTED`** (`EDUCATOR_STANDARD`) with reason `MISSING_EVIDENCE` and the stated missing item (`sisterId`), applicant sees the reason | Beat 4 / rejection-then-resubmit state |
| `usr_reviewer` | `reviewer@lmns.id` | ADMIN | Verified, **queue shows two applications** (hendra pending, dewi rejected) | Beat 4 |

Supply-only mentors (all `APPROVED`, verified, listed, with packages) so that discovery has 8 listed mentors across six disciplines and all three tiers:

| id | Email | Tier | Discipline | Institution | Fee / package |
|---|---|---|---|---|---|
| `usr_maya` | `maya@itb.ac.id` | BASIC | Computer Science | ITB | from `Rp 120.000` |
| `usr_rizky` | `rizky@unair.ac.id` | BASIC | Public Health | UNAIR | from `Rp 100.000` |
| `usr_putri` | `putri@ugm.ac.id` | EDUCATOR_STANDARD | Economics | UGM | `Rp 0` consultation |
| `usr_agus` | `agus@ui.ac.id` | EDUCATOR_STANDARD | Law | UI | `Rp 0` consultation |
| `usr_nina` | `nina@unair.ac.id` | BASIC | Education | UNAIR | from `Rp 90.000` |
| `usr_tono` | `tono@its.ac.id` | EDUCATOR_PREMIUM | Engineering | ITS | from `Rp 300.000` |

`usr_sari` covers Education at standard tier; the six disciplines are Computer Science, Public Health, Economics, Law, Education, Engineering. Languages must include at least one `id`-only and one `id,en` mentor; formats must include both `online` and `online, in-person` so the filters return non-trivial and empty sets. Overseas destinations (`SG`, `NL`, `AU`, `JP`) must be spread so `destination` filters have both hits and misses.

## 4. Reproduction of §5 demo states

S2 must add these fixtures so each story is demoable without editing data. Ids are fixed; timestamps derive from `SEEDED_AT`.

| Fixture | Id | Data |
|---|---|---|
| Booking awaiting review (Rani ↔ Adi) | `bkg_rani_adi_1` | `COMPLETED`, paid, thread `OPEN`, all alignment items confirmed, `completed_at = SEEDED_AT + 9 days`, `review_eligible_at = +60 min` (already past), no review |
| Booking in mediation, one-sided (Citra ↔ Tono) | `bkg_citra_tono_1` | `PAID`, paid, thread with 4 messages, `scope` confirmed by mentee only, `schedule` proposed and unconfirmed, `fee` unconfirmed |
| Pending booking (Rani ↔ Sari) | `bkg_rani_sari_1` | `AWAITING_PAYMENT` (or `PAYMENT_FAILED` with a retry path), platform fee from config, intake note with `stressLevel` |
| Reviews on Adi's profile | `rev_1`, `rev_2` | Two published reviews, each with distinct axis values (e.g. 5/4 and 4/5) so the UI must render two separate ratings; mood rows exist but are never exposed |
| Admin queue | `app_hendra`, `app_dewi` | The two applications above, with `application_evidence` rows and one missing flag |
| Notifications | `ntf_rani_review`, `ntf_citra_align` | Review prompt for Rani, alignment nudge for Citra — proves US 5.1's deep-link surface |
| Templated reasons | `MISSING_EVIDENCE`, `DOMAIN_INVALID`, `SELF_ASSESSMENT_INCOMPLETE`, `CERTIFICATE_INVALID` | Seed for `/api/admin/reasons` |
| Training modules | `m1`–`m4` | Four modules; Adi has all four complete + a passed assessment; Sari has none |

Expected values the demo (and tests) can assert after seeding:

```sql
SELECT COUNT(*) FROM users;                       -- 14
SELECT COUNT(*) FROM mentors WHERE status='APPROVED'; -- 8
SELECT tier, COUNT(*) FROM mentors WHERE status='APPROVED' GROUP BY tier; -- all three tiers > 0
SELECT COUNT(*) FROM mentors WHERE status='PENDING_REVIEW'; -- 1 (hendra)
SELECT COUNT(*) FROM reviews;                      -- 2
SELECT COUNT(*) FROM bookings WHERE status='COMPLETED'; -- 1
```

## 5. Reseeding and reset semantics

- `npm run seed` twice in a row leaves the database in the same state and the same row counts; the second run's output is identical (`Seeded …: 14 accounts, 10 mentor profiles, 8 listed mentors.`).
- `npm run db:reset` is the only supported way to change seed data; it deletes the file, so stale rows from manual poking cannot survive.
- The seed never deletes or rewrites anything outside its own tables, and it never touches `apps/api/data` files other than the database.
- Seed output prints the resolved database path so the operator can confirm which file was written (`config.dbPath`).

## 6. Adding data later

New fixtures follow the same rules: fixed id, `SEEDED_AT`-relative timestamp, declared in the account/supply tables above, inserted in FK order, and reflected in this document. If a fixture is needed only by a test, build it in the test instead of the seed.
