# Business Requirements Document (BRD)

## LMNS — Academic Balance & Well-Being Mentor–Mentee Marketplace

| Field | Value |
|---|---|
| Document | Business Requirements Document |
| Initiative | LMNS Marketplace (MVP) |
| Version | 1.0 (draft for approval) |
| Prepared By | Product Management (PM / PO) |
| Source Input | `user_stories.md` — LMNS User Story Specification v1.0 |
| Status | Draft — pending business sign-off |
| Date | 2026-11-18 |

---

## 1. Executive Summary

LMNS is a mentorship marketplace for Indonesian higher-education students (S1, S2, S3) built around **academic balance and student well-being**. It connects students with verified academics — S2 graduates with international exposure, S3 lecturers/researchers, and S3 mentors holding well-being coaching credentials — through a structured consultation flow that combines clinical-style credentialing (Halodoc) with flexible service discovery and self-published mentor storefronts (Superprof).

The business opportunity is a trust gap: academic mentoring in Indonesia is largely informal, referral-driven, and unverified, while student demand for thesis, publication, and scholarship guidance is high and increasingly entangled with burnout. LMNS monetises the trust layer — verification, structured pre-session mediation, and well-being accountability — rather than the session itself.

The MVP launches in three gated phases: supply-side seeding and credential vetting first, then `.ac.id` student onboarding plus marketplace discovery, then platform-fee checkout, the pre-session mediation room, and dual-axis post-session reviews.

> **Note on quantitative data:** the source specification contains no market sizing, pricing figures, or traffic forecasts. Those cells are marked `<!-- DATA NEEDED -->` rather than guessed; they must be supplied by business owners before this BRD is approved.

---

## 2. Business Context & Problem Statement

### 2.1 Problem Statement

Indonesian S1–S3 students seeking serious academic guidance have no trustworthy way to select a mentor. Today they rely on informal referrals and unvetted contacts where:

- **Credentials are unverifiable.** There is no fast way to confirm that a "mentor" genuinely holds an S2/S3 degree, an active SISTER registration, or a Scopus/ORCID research record.
- **Expectations are unaligned.** Scope, deliverables, schedule, and fees are agreed informally and often over chat, so disputes surface only after the student has paid.
- **Well-being is ignored.** Academic pressure and burnout are treated as personal weakness rather than as a dimension of mentoring quality; students cannot tell which mentors are equipped to handle it.
- **Serious mentors are hard to find and hard to be found.** Qualified lecturers and researchers lack a credible channel to publish verified expertise without discounting their academic standing.

### 2.2 Business Opportunity

A verified, well-being-aware marketplace captures value at the point where trust is created — credential verification and structured pre-session alignment — and lets the actual mentoring fee settle directly between the parties (Standard track) or through a managed premium package (Premium track).

### 2.3 Why Now

Digitally native S1–S3 students already transact on marketplaces and telehealth platforms; the behavioural pattern (search → book → pay a platform fee → consult) is established. LMNS's differentiation is the verification depth and the explicit well-being dimension, not a new consumer habit.

---

## 3. Business Objectives & KPIs

### 3.1 Business Goals

| ID | Business Goal | Rationale |
|---|---|---|
| BG-1 | Establish a **verified** mentor supply base before demand launches | Marketplace trust collapses if unverified mentors appear on day one; Phase 1 is deliberately supply-first. |
| BG-2 | Monetise the trust layer via a mandatory platform booking fee | The fee is charged for verification, mediation, and dispute handling — independent of session pricing. |
| BG-3 | Create a defensible premium tier (Well-Being Certified mentors) | Premium certification is owned by LMNS (internal training + badge), creating a proprietary quality standard rather than a commodity listing. |
| BG-4 | Digitise the pre-session agreement | Reduces disputes and refund requests by making scope, schedule, and fee explicit and mutually confirmed before the session. |
| BG-5 | Build a well-being signal loop | Dual-axis reviews and post-session mood checks generate proprietary data on mentoring quality and student stress. |

### 3.2 Success Metrics

| Metric Type | Definition | Target |
|---|---|---|
| Supply | Verified mentors onboarded at launch | <!-- DATA NEEDED: target headcount per tier for Phase 1 cohort --> |
| Supply quality | Share of Premium (Well-Being Certified) mentors in the launch cohort | <!-- DATA NEEDED: business target percentage --> |
| Verification operations | Mentor application decision within published SLA | 100% within 2–3 business days (SLA defined in source spec) |
| Demand | Verified `.ac.id` / `.edu` mentee registrations | <!-- DATA NEEDED: Phase 2 target --> |
| Monetisation | Platform fee conversion rate (bookings paid ÷ mentor page visits) | <!-- DATA NEEDED --> |
| Monetisation | Completed sessions per paid booking | <!-- DATA NEEDED --> |
| Quality | Average Empathy & Well-Being rating vs. Academic Clarity rating | Both tracked separately; no blended score. Baseline after first cohort. |
| Trust | Share of bookings with both parties' agreement confirmed before session start | 100% (no session may enter `Scheduled` otherwise) |
| Retention | Mentee repeat-booking rate within 90 days | <!-- DATA NEEDED --> |
| Operations | Disputes raised per 100 completed bookings | <!-- DATA NEEDED: acceptable ceiling --> |

---

## 4. Target Market & Segments

### 4.1 Primary Segments

| Segment | Description | Core Need | LMNS Value |
|---|---|---|---|
| **S1 students (thesis stage)** | Undergraduates working on skripsi, methodology, or seminar papers | Credible guidance at a specific academic stage, at controlled cost | Verified mentor + structured pre-session alignment before paying a session fee |
| **S2 students** | Master's students preparing publications, thesis defence, or doctoral applications | Research-methodology depth and publication guidance | S3 mentors with Scopus/ORCID-verified records |
| **S3 students** | Doctoral candidates and early researchers | Specialist supervision, overseas/doctoral roadmap | Premium mentors with international experience |

### 4.2 Supply Segments

| Tier | Criteria (from source spec) | Commercial Model |
|---|---|---|
| **Basic Mentor** | ≥ S2 degree + overseas study/work experience; verified via institutional email or organisation link + Google Scholar + LinkedIn | Standard marketplace listing; platform booking fee applies |
| **Educator Mentor (Standard)** | ≥ S3 degree (lecturer, researcher, academician); verified via SISTER ID + institutional email + Google Scholar + LinkedIn | Free marketplace consultation (session fee Rp 0); platform fee applies |
| **Educator Mentor (Premium)** | S3 + overseas experience; verified via Scopus/ORCID or institutional page + Google Scholar + LinkedIn + LMNS Well-Being Training & Mental Health Coaching Certificate | Highlighted listing, Well-Being Verified badge, higher-value structured packages |

### 4.3 Positioning

For Indonesian higher-education students who cannot tell a credible academic mentor from an unvetted contact, LMNS is a verification-first mentoring marketplace that makes credentials, expectations, and well-being support explicit before money changes hands — unlike referral-based tutoring channels or generic expert marketplaces, which verify neither academic standing nor mentoring conduct.

---

## 5. Business Requirements

Each requirement traces to the source user stories (US IDs) and is delivered through the product scope in `product_requirement.md`.

| ID | Business Requirement | Priority | Source |
|---|---|---|---|
| BR-01 | The business must restrict mentee access to verified students of accredited Indonesian higher-education institutions, using official institutional email domains. | Must | US 1.1 |
| BR-02 | The business must capture each mentee's academic level, institution, faculty/major, semester, and primary academic/well-being goals at onboarding. | Must | US 1.1 |
| BR-03 | The business must collect a private well-being baseline from each mentee and use it only to improve mentor matching, never to profile or expose the student. | Must | US 1.2 |
| BR-04 | The business must operate a three-tier mentor taxonomy (Basic, Educator Standard, Educator Premium) with tier-specific credential evidence. | Must | US 2.1 |
| BR-05 | The business must require every mentor — regardless of tier — to complete a psychological readiness and empathy self-assessment before listing. | Must | US 2.1 |
| BR-06 | The business must require every mentor to publish a structured promotional storefront (niche, strengths, languages, formats, intro, packages) before listing. | Must | US 2.1 |
| BR-07 | The business must operate a documented verification queue with an SLA of 2–3 business days and templated approve/reject decisions. | Must | US 2.1, US 5.2 |
| BR-08 | The business must offer a self-service upgrade path from Basic/Standard to Premium, gated by LMNS well-being training plus verification of S3, overseas experience, and coaching certification. | Must | US 2.2 |
| BR-09 | The business must provide tier-aware discovery so mentees can filter by discipline, degree focus, mentor tier, and overseas destination. | Must | US 3.1 |
| BR-10 | The business must charge a mandatory platform booking fee before any mentor–mentee direct contact is enabled, collected through local Indonesian payment methods (QRIS, Virtual Account, GoPay/OVO/Dana). | Must | US 4.1 |
| BR-11 | The business must mediate a structured pre-session agreement (scope/deliverables, schedule/link, fee and settlement method) requiring bilateral confirmation before a session is scheduled. | Must | US 4.1 |
| BR-12 | The business must make the Premium tier's incremental value explicit at the point of purchase. | Should | US 4.2 |
| BR-13 | The business must collect dual-axis post-session feedback (academic clarity and empathy/well-being) plus a light mood check, and publish the dual ratings on mentor pages. | Must | US 5.1 |
| BR-14 | The business must maintain an operations console for credential verification, missing-evidence flagging, domain validation, and Premium badge issuance. | Must | US 5.2 |
| BR-15 | The business must keep session fees off-platform for the Standard track (Rp 0 consultations) and transparent in the Premium track, with LMNS revenue limited to the platform fee / package terms stated at checkout. | Must | US 4.1 |

### 5.1 Business Rules

- A mentor cannot appear in discovery before verification is complete.
- A mentee cannot see a mentor's direct contact or book a session without paying the platform fee.
- A session cannot hold `Scheduled` status until both parties confirm the alignment card.
- The Premium badge is issued only by LMNS operations and is revoked if credentials lapse or conduct standards are breached. <!-- DATA NEEDED: formal revocation policy and re-verification cadence -->
- Well-being pulse data is private to the mentee and is never shown to mentors in raw form.

---

## 6. Scope

### 6.1 In Scope (MVP)

- Mentee registration and institutional-email verification (S1/S2/S3).
- Mentee onboarding goals and well-being baseline pulse.
- Mentor multi-step application with tier selection, credential evidence, well-being self-assessment, and storefront builder.
- Admin verification console (SISTER/Scopus/ORCID/institutional email/certificate checks).
- Premium upgrade flow with LMNS well-being training and badge issuance.
- Tier-aware mentor discovery, filters, and promotional pages.
- Booking request, session intake note, platform-fee checkout via Indonesian gateways.
- Pre-session mediation thread and bilateral alignment card.
- Post-session dual-axis review and mood check.
- Premium vs. standard value comparison at checkout.

### 6.2 Out of Scope (MVP)

- Clinical or therapeutic services, diagnosis, or crisis intervention. LMNS is non-clinical by design.
- Video-conferencing infrastructure — sessions run on the mentor's/mentee's chosen tool; LMNS supplies the link field only.
- Stored-value wallets, credits, or reusable balances.
- LMNS-held session fees for the Standard (Educator free-marketplace) track.
- Native mobile apps (MVP is web-first). <!-- DATA NEEDED: confirm mobile roadmap expectation -->
- Automated institutional registry integration with PDDIKTI/SISTER APIs (MVP relies on manual admin verification). <!-- DATA NEEDED: confirm whether an API partnership is planned -->
- Escrow for Premium packages — the source user stories describe direct settlement; escrow is a candidate post-MVP capability. <!-- DATA NEEDED: confirm commercial intent -->

---

## 7. Stakeholders

| Stakeholder | Role in Initiative | Interest |
|---|---|---|
| Business Owner / Sponsor | Funding, pricing approval, launch go/no-go | Revenue, market position |
| Product Management | Scope, backlog, acceptance | Delivery predictability |
| Operations / Verification Admin | Mentor credential vetting, badge issuance | Queue SLA, clear evidence rules |
| Engineering (Backend / Frontend) | Platform build | Clear, testable requirements |
| Design | Storefronts, checkout, mediation UX | Well-being-safe interaction patterns |
| Mentors (S2/S3 academics) | Supply side | Credibility, fair fees, listing quality |
| Mentees (S1–S3 students) | Demand side | Trust, affordability, psychological safety |
| Legal / Compliance | Student data privacy, non-clinical positioning | Regulatory exposure |
| Payment partners | QRIS / VA / e-wallet processing | Integration compliance |

---

## 8. Commercial Model

| Revenue Stream | Mechanism | Status |
|---|---|---|
| Platform booking fee (all tiers) | Charged to mentee at booking, before mediation thread opens | Defined in source; **amount `<-- DATA NEEDED -->`** |
| Premium packages | Structured, higher-value packages sold by Well-Being Certified mentors; LMNS terms at checkout | Defined in source; **fee split `<-- DATA NEEDED -->`** |
| Standard Educator consultations | Session fee Rp 0; platform fee only | Defined in source |
| Basic Mentor sessions | Session fee agreed directly in mediation; platform fee only | Defined in source |

Open commercial questions (must be resolved before Phase 3 build):

1. Exact platform fee amount and whether it varies by tier. `<!-- DATA NEEDED -->`
2. Premium package revenue share and settlement mechanics. `<!-- DATA NEEDED -->`
3. Refund policy for platform fees when a mentor or mentee cancels or ghosts. `<!-- DATA NEEDED -->`
4. Whether the platform fee is credited against the session fee. `<!-- DATA NEEDED -->`

---

## 9. Assumptions, Constraints & Dependencies

### 9.1 Assumptions

- Indonesian students hold and actively use official institutional email addresses.
- SISTER ID, Scopus ID, ORCID iD, and Google Scholar profiles are sufficient public evidence for academic verification.
- Academics will self-serve through a multi-step application without assisted onboarding.
- Students will pay a platform fee before speaking to a mentor, as they do on telehealth platforms.
- Well-being coaching certification can be delivered asynchronously by LMNS.

### 9.2 Constraints

- Non-clinical positioning must be explicit in all copy; no diagnosis, therapy, or crisis-handling claims.
- Mentor well-being self-assessment and training content must be reviewed by a qualified professional before launch. `<!-- DATA NEEDED: named reviewer/partner -->`
- Payment collection must use licensed local Indonesian gateways.
- Verification depends on manual admin work in the MVP; throughput sets the supply launch date.

### 9.3 Dependencies

- Local payment gateway accounts and merchant onboarding (QRIS, VA, e-wallets).
- Operations staffing plan for the verification queue and SLA.
- Well-being training curriculum and assessment instrument.
- Legal review of student data handling (institutional emails, stress/mood data).
- Design system and copy standards for well-being-sensitive language.

---

## 10. Risks & Mitigations

| ID | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| R-1 | Unverified or fabricated credentials reach the marketplace | High — destroys core value proposition | Medium | Manual admin verification with evidence links, tier-specific gates, audit trail, badge revocation |
| R-2 | Verification queue becomes a bottleneck and starves supply | High — launch slips | Medium | SLA tracking, templated decisions, missing-evidence flags, staged cohort onboarding |
| R-3 | Mentees bypass the platform fee by exchanging contacts early | High — revenue loss | Medium | Contact details withheld until fee is paid; mediation thread only after payment |
| R-4 | Well-being features read as clinical services, creating regulatory exposure | High | Medium | Non-clinical copy, explicit disclaimers, professional review of assessments, no diagnosis claims |
| R-5 | Mood/stress data is mishandled or exposed | High — reputational and legal | Low–Medium | Private-by-design baseline, aggregate-only usage, access controls, privacy review |
| R-6 | Direct settlement disputes (mentor no-show, fee disagreement) damage trust | Medium | High | Bilateral alignment card recorded before scheduling; admin-visible agreement; documented dispute path |
| R-7 | Premium tier perceived as pay-to-rank rather than quality | Medium | Medium | Certification is training-gated and reviewed, badge criteria published |
| R-8 | Low mentor supply in niche disciplines weakens discovery | Medium | High | Seed by discipline priority; publish coverage gaps to operations |
| R-9 | Payment gateway availability/fees erode unit economics | Medium | Low–Medium | Multiple gateways; fee modelled into platform-fee pricing |

---

## 11. Benefits

| Benefit | Type | Evidence of Success |
|---|---|---|
| Students gain verifiable mentor selection | User | Mentees complete booking without off-platform contact leakage; repeat bookings |
| Qualified academics gain a credible channel | Supply | Verified mentor count and listing completion rate |
| LMNS owns a proprietary quality standard | Strategic | Share of Premium certified mentors; badge recognition |
| Disputes are reduced through explicit agreements | Operational | Dispute rate per 100 bookings |
| Well-being becomes measurable | Strategic | Dual-axis ratings and mood-check trend data |

---

## 12. Roadmap & Milestones

Sequenced exactly as specified in the source (`Suggested MVP Rollout Sequence`).

| Phase | Scope | Deliverables | Exit Criteria | Dependencies |
|---|---|---|---|---|
| **Phase 1 — Supply-Side Seeding** | US 2.1, US 2.2, US 5.2 | Mentor application portal, credential vetting console, well-being training + Premium certification flow | Launch cohort of S2/S3 mentors verified; first wave of Premium Well-Being mentors certified | Training curriculum; ops staffing; legal review |
| **Phase 2 — Demand-Side & Discovery** | US 1.1, US 1.2, US 3.1 | `.ac.id` student sign-up + OTP, onboarding goals and pulse, filterable marketplace, mentor promotional pages | Students can register, be verified, and discover/filter verified mentors | Phase 1 complete (verified supply) |
| **Phase 3 — Mediation & Monetisation** | US 4.1, US 4.2, US 5.1 | Platform-fee checkout (QRIS/VA/e-wallet), pre-session mediation room, alignment card, dual-axis reviews and mood check | First paid booking completes end-to-end with confirmed agreement and post-session review | Payment gateway live; Phase 2 complete |

Target dates: `<!-- DATA NEEDED: phase start/end dates and launch date -->`

---

## 13. Open Questions

1. What is the platform booking fee amount, and does it differ by mentor tier?
2. What are the Premium package price bands and LMNS's revenue share?
3. Which disciplines and institutions are prioritised for the Phase 1 mentor cohort, and what is the headcount target?
4. Who owns the well-being training curriculum and assessment instrument, and what qualification must they hold?
5. What is the refund and dispute policy for platform fees (cancellation, no-show, ghosting)?
6. Is a mobile app expected within the first year, or is web-only acceptable for MVP?
7. Are PDDIKTI/SISTER API integrations planned, or does verification remain manual?
8. What SLA applies to admin responses inside the mediation thread?

---

## 14. Approval

| Role | Name | Decision | Date |
|---|---|---|---|
| Business Owner / Sponsor | <!-- DATA NEEDED --> | Pending | |
| Head of Product | <!-- DATA NEEDED --> | Pending | |
| Operations Lead | <!-- DATA NEEDED --> | Pending | |
| Legal / Compliance | <!-- DATA NEEDED --> | Pending | |

---

## 15. Attachments

- `user_stories.md` — LMNS User Story Specification (source input)
- `product_requirement.md` — Product Requirements Document for this initiative
- `<!-- DATA NEEDED: Business Model Canvas, market research, financial model -->`
