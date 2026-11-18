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
npm run seed     # deterministic dummy data
npm run dev      # API + web
```

Exact ports, demo accounts, and the demo script are documented in `docs/prototype-scope.md` and `README` sections added by the scaffold.

## Ground rules

- **No inherited code.** Do not import, copy, or "align with" any prior LMNS implementation.
- **Copy claims must be enforceable.** If the prototype cannot enforce a promise, it does not appear in user-facing copy.
- **Well-being data stays private.** No raw pulse, stress, or mood value is ever shown to a mentor or admin, and no score is reflected back to the mentee.
- **Config over constants.** Platform fee, tier labels, and demo OTP come from configuration.
- **No secrets in the repository**, and no real payment, email, or video integration.
