# Product Requirements Document (PRD)

## LMNS — Academic Balance & Well-Being Mentor–Mentee Marketplace

## 1. Executive Summary

LMNS is a web marketplace that connects Indonesian higher-education students (S1, S2, S3) with verified academic mentors, built on an explicit contract of academic balance and student well-being. It combines Halodoc-style credentialing and structured consultation flow with Superprof-style self-published mentor storefronts, so a mentee can verify who a mentor is, agree on what a session covers, and pay a transparent platform fee before any direct contact happens.

The product replaces the informal referral-and-chat process students use today, in which credentials are unverifiable, scope and fees are agreed verbally, and mentors' capacity to handle academic stress is unknown. LMNS makes all three explicit through three mentor tiers (Basic, Educator Standard, Educator Premium), a mandatory well-being self-assessment for every mentor, and a bilateral alignment card completed before a session is scheduled.

Expected impact: students gain trustworthy mentor selection and psychological safety; qualified academics gain a credible channel for verified expertise; LMNS monetises the trust layer through a platform booking fee plus a proprietary Premium Well-Being certification tier.

## 2. Overview

| Field | Value |
|---|---|
| Initiative Name | LMNS Marketplace MVP — Academic Balance & Well-Being Mentoring |
| Version | 1.0 (draft for approval) |
| Prepared By | Product Management (PM / PO) |
| Epic | LMNS Marketplace (Epics 1–5: Mentee Onboarding, Mentor Vetting, Discovery, Booking Mediation & Payment, Session Execution & Governance) |
| Release Plan | Three gated phases — Phase 1 supply-side seeding, Phase 2 demand-side & discovery, Phase 3 mediation & monetisation. Dates: `<!-- DATA NEEDED -->` |
| Source Input | `user_stories.md` (LMNS User Story Specification v1.0) |
| Related Document | `business_requirement.md` (BRD, BR-01 … BR-15) |

## 3. Objectives

### a. Business Goals

- Launch with a verified mentor supply base, so no unverified mentor can appear in discovery (BG-1).
- Monetise the trust layer through a mandatory platform booking fee that is charged independently of session pricing (BG-2).
- Establish a proprietary Premium Well-Being Certified tier, gated by LMNS training and credential verification (BG-3).
- Digitise the pre-session agreement so scope, schedule, and fee are mutually confirmed before a session starts (BG-4).
- Build a well-being signal loop from dual-axis reviews, post-session mood checks, and baseline pulses (BG-5).

### b. User Goals

**Mentee (S1/S2/S3 student)**
- Register with my official university email so I know the community is student-only and legitimate.
- Understand a mentor's credentials and research focus before investing money or trust.
- Align on scope, deliverables, schedule, and cost before a session, so nothing is left ambiguous.
- Choose a mentor whose mentoring style fits my current stress level and learning preference.

**Mentor (Basic / Educator Standard / Educator Premium)**
- Publish verified academic standing without disclosing unnecessary personal data.
- Control my listing: niche, methods, languages, formats, packages, and pricing.
- Upgrade to Premium to stand out and offer higher-value packages, without re-entering verified credentials.
- See exactly which evidence is missing when an application is rejected.

**LMNS Operations Admin**
- Review applications in one queue with evidence links in one place.
- Approve or reject with templated reasons, and issue or revoke Premium badges.
- Detect missing or invalid credentials quickly enough to meet the 2–3 business-day SLA.

### c. Out of Scope

- Clinical, therapeutic, diagnostic, or crisis-intervention services of any kind.
- Built-in video conferencing; the platform records a session link only.
- Stored-value wallets, credits, or reusable balances.
- LMNS holding Standard-track session fees; those settle directly between the parties.
- Native mobile applications for the MVP (web-first).
- Automated PDDIKTI/SISTER registry API integration; verification is manual in the MVP.

## 4. Background & Supporting Data

- **Market insight:** Indonesian S1–S3 students routinely seek paid guidance for thesis, publication, and scholarship preparation, and already transact through marketplaces and telehealth apps. Quantitative market sizing: `<!-- DATA NEEDED -->`.
- **User problem summary:**
  - Mentor credentials (S2/S3, SISTER, Scopus/ORCID) cannot be checked quickly or reliably.
  - Scope, deliverables, schedule, and fees are agreed informally over chat; disputes appear after payment.
  - Academic stress and burnout are invisible in mentor selection; there is no signal of a mentor's capacity to support well-being.
  - Credible academics lack a low-friction channel to publish verified expertise.
- **Industry trend:** Trust-and-verification platforms (credentialed telehealth, vetted expert marketplaces) have normalised paying a platform fee for access to a verified professional, which is the behavioural pattern LMNS reuses.
- **Benchmarks referenced by the source spec:** Halodoc (clinical credentialing and triage-style structured consultation) and Superprof (self-published mentor storefront and flexible service discovery).

## 5. Segmenting / Targeting / Positioning

**Primary User**

| Segment | Needs | Benefit |
|---|---|---|
| S1 students (thesis/skripsi stage) | Trustworthy guidance at a defined academic stage; predictable cost; psychological safety | Verified mentor, explicit alignment, controlled spend via platform fee |
| S2 students (publication/doctoral prep) | Research-methodology and publication depth | S3 mentors with Scopus/ORCID-verified records |
| S3 students / early researchers | Specialist supervision and international academic roadmap | Premium mentors with overseas experience and curated roadmap |
| Basic Mentors (S2 + overseas experience) | Credible listing and demand | Standard marketplace listing with verified academic badges |
| Educator Mentors, Standard (S3, SISTER) | Zero-cost consultation channel and visibility | Free marketplace listing for 1-on-1 academic consultation |
| Educator Mentors, Premium (S3 + overseas + well-being certified) | Differentiation and higher-value packages | Highlighted listing, Well-Being Verified badge, structured premium packages |

**Secondary User**

| Segment | Needs |
|---|---|
| LMNS Operations Admin | A single verification queue with evidence links, validation flags, and templated decisions |
| LMNS Well-Being Training Owner | Asynchronous training delivery and assessment for Premium certification |
| Student affairs / campus communities (potential channel partners) | A credible referral destination for students in academic distress |

**Positioning statement:** For Indonesian higher-education students who cannot distinguish a credible academic mentor from an unvetted contact, LMNS is a verification-first mentoring marketplace that makes credentials, expectations, and well-being support explicit before money changes hands.

## 6. Success Metrics

| Metric Type | Definition | Target |
|---|---|---|
| User-Centric | Share of mentor profile views that reach a paid booking request | `<!-- DATA NEEDED -->` |
| User-Centric | Share of mentees completing onboarding (email verify + pulse) among registrations | `<!-- DATA NEEDED -->`; baseline in Phase 2 |
| User-Centric | Average rating on "Empathy & Well-Being Support" axis | Tracked separately from academic axis; `<!-- DATA NEEDED: acceptable floor -->` |
| User-Centric | Average rating on "Academic & Research Guidance" axis | `<!-- DATA NEEDED -->` |
| Business | Verified mentors onboarded per phase | `<!-- DATA NEEDED: headcount per tier -->` |
| Business | Share of Premium (Well-Being Certified) mentors in the active supply base | `<!-- DATA NEEDED -->` |
| Business | Platform-fee conversion rate (paid bookings ÷ checkout starts) | `<!-- DATA NEEDED -->` |
| Business | Mentee repeat-booking rate within 90 days | `<!-- DATA NEEDED -->` |
| Operational | Mentor application decision within published SLA | 100% within 2–3 business days |
| Operational | Bookings with bilateral agreement confirmed before session start | 100% (hard gate — no session may be `Scheduled` otherwise) |
| Operational | Mentor applications rejected for missing evidence and re-submitted successfully | `<!-- DATA NEEDED -->` |
| Technical | Checkout success rate across QRIS / VA / e-wallet | `<!-- DATA NEEDED: e.g. ≥ 98% of initiated payments -->` |
| Technical | OTP email delivery success rate | `<!-- DATA NEEDED -->` |
| Technical | Service availability during launch window | `<!-- DATA NEEDED: e.g. ≥ 99.5% -->` |
| Technical | Median checkout-to-mediation-thread activation time | `<!-- DATA NEEDED -->` |

## 7. User Journey

**Mentee journey**

1. Registers with an institutional email; enters academic level, university, faculty/major, semester, and primary goals. Account is `Unverified` until the OTP link is clicked.
2. Completes a 3–5 question Academic Stress & Balance pulse and selects a preferred mentoring tone.
3. Searches and filters mentors by discipline, degree focus, tier, and overseas destination; opens a mentor's promotional page and inspects verified links and dual-axis reviews.
4. Selects a mentor, fills a Session Intake Note (topic, bottleneck, stress level), and pays the platform booking fee.
5. Enters the Pre-Session Mediation Thread; together with the mentor completes the Alignment Card (scope/deliverables, schedule/video link, session fee & settlement method). Both click **Confirm Agreement**.
6. Session is `Scheduled` and takes place on the agreed video link.
7. One hour after completion, the mentee submits two ratings (Academic & Research Guidance; Psychological Safety & Well-Being Support) and a one-tap mood check.

**Mentor journey**

1. Selects a target tier and submits identity and institutional evidence for that tier.
2. Completes the mandatory well-being self-assessment.
3. Builds the promotional storefront (niche, methods, languages, formats, intro video/bio, packages).
4. Application sits in `Pending Admin Verification` with SLA tracking (2–3 business days).
5. On approval, the mentor is listed; on rejection, receives a templated reason naming the missing evidence.
6. Existing Basic/Standard mentors can click **Upgrade to Premium Mentor**, take LMNS well-being training plus assessment, upload the coaching certificate, and receive the Premium badge after verification.
7. Handles incoming bookings inside the mediation thread and confirms the alignment card.

**Operations journey**

1. Works the verification queue; each application shows direct links to verify SISTER ID, Scopus/ORCID, institutional email, and certificate evidence.
2. Sees flags for missing credentials and invalid institutional domains.
3. Approves or rejects with a templated reason in one click; issues or manages Premium badges.

## 8. User Stories

| Requirement | User Story | Acceptance Criteria | Priority |
|---|---|---|---|
| **US 1.1 — Student registration via academic email** | As an Indonesian S1/S2/S3 student, I want to register with my official university email so that I gain access to a trusted, student-only mentorship community. | <br>• Registration accepts only domains matching an accredited Indonesian higher-education institution (`.ac.id` allowlist; `.edu` where applicable).<br>• Non-matching domains are rejected with a message naming the accepted domain policy; the form state is preserved.<br>• An OTP verification link is sent to the institutional address; the account stays `Unverified` and cannot book until the link is clicked.<br>• Expired or reused OTP links show a recoverable error and offer resend; resend is rate-limited.<br>• Onboarding captures academic level (S1/S2/S3), university name, faculty/major, current semester, and one or more primary goals (e.g. Thesis Anxiety, Overseas Scholarship Prep, Research Methodology, Burnout Prevention).<br>• Required-field validation blocks submission; S1/S2/S3 selection is mandatory before goal selection.<br>• Duplicate registration on the same email offers sign-in or password reset instead of creating a second account. | High Priority (Must) |
| **US 1.2 — Well-being & academic balance baseline check-in** | As a newly registered mentee, I want to complete a brief Academic Stress & Balance pulse check so that LMNS recommends mentors whose style and badges fit my current needs. | <br>• Pulse consists of 3–5 Likert-scale questions covering workload stress, thesis/research blockers, and preferred mentoring tone (e.g. *Gentle & Encouraging* vs. *Structured & Direct*).<br>• Pulse can be skipped; skipping must not block onboarding, and matching falls back to declared goals.<br>• Responses are visible only to the mentee — never displayed to mentors, on public profiles, or in any shared view.<br>• Responses are used solely as matching inputs; no score, label, or diagnosis is displayed back to the user beyond a neutral confirmation.<br>• Pulse is re-promptable later (e.g. before a new booking) without overwriting history; previous results are retained for matching accuracy.<br>• Submission stores answers with a timestamp and the mentee reference. | High Priority (Must) |
| **US 2.1a — Mentor application: tier selection & identity verification** | As a lecturer, researcher, or S2/S3 graduate with international exposure, I want a structured, step-by-step application so that I can be verified for the correct mentor tier. | <br>• Flow is a multi-step wizard (identity/institutional verification → well-being self-assessment → storefront) with progress persistence and safe resume.<br>• Mentor selects a target tier first; subsequent required fields change accordingly.<br>• **Basic Tier:** requires S2 diploma/transcript upload or link, proof of overseas study/work, official organisation link, Google Scholar URL, LinkedIn URL.<br>• **Educator Standard:** requires S3 verification, SISTER ID with format validation, institutional email OTP, Google Scholar URL, LinkedIn URL.<br>• **Educator Premium:** requires S3 verification, overseas experience proof, Scopus ID / ORCID ID (or institutional webpage), Google Scholar URL, LinkedIn URL, and a valid Mental Health Coaching Certificate upload.<br>• Invalid URL formats, unreadable uploads, and SISTER-ID format errors are rejected inline with field-level messages.<br>• Submit is blocked while any tier-required item is missing; the missing items are listed explicitly.<br>• Submission moves the application to `Pending Admin Verification` with SLA tracking visible to the applicant (2–3 business days).<br>• Applicant cannot edit verified academic evidence while under review; they can withdraw and resubmit. | High Priority (Must) |
| **US 2.1b — Mandatory well-being self-assessment** | As a mentor applicant, I want to complete a psychological readiness and empathy self-assessment so that LMNS can confirm I can hold a well-being-safe mentoring relationship. | <br>• Form is mandatory for every tier; the application cannot be submitted without it.<br>• Covers mentoring philosophy, boundary-setting habits, and approach to student burnout.<br>• Answers are stored with the application and are reviewable by LMNS admin only; they are not published on the mentor's public page.<br>• A completed self-assessment is a precondition for admin approval, including for tier upgrades. | High Priority (Must) |
| **US 2.1c — Deep-dive expertise & promotional storefront** | As a mentor applicant, I want to build a Superprof-style storefront so that prospective mentees can judge my fit before booking. | <br>• Storefront captures research niche, methodological strengths, languages, session formats, introductory video/bio, and service packages.<br>• At least one service package (title, description, duration, price or "Free consultation") is required for Educator Standard.<br>• Storefront content length limits are enforced with a live character count.<br>• Preview shows exactly how the public promotional page will render before publishing.<br>• Storefront is unpublished until admin approval, and the mentor sees a clear empty/pending state. | High Priority (Must) |
| **US 2.2 — Premium upgrade & well-being certification** | As a verified Basic or Standard Educator Mentor, I want to upgrade to Premium by completing LMNS well-being training and uploading my coaching credentials so that I earn the Premium badge and stand out. | <br>• One-click **Upgrade to Premium Mentor** CTA in the Mentor Dashboard; previously verified academic credentials are not re-entered.<br>• Upgrade grants access to asynchronous Well-Being & Academic Empathy training modules plus assessment quiz.<br>• Quiz result is recorded; a failed attempt shows the score and allows a retake per the retake policy.<br>• Premium badge is applied automatically only after: training passed + S3 verified + overseas experience verified + mental health coaching certificate verified by admin.<br>• Until all conditions hold, the mentor remains on their current tier and sees a checklist of outstanding items.<br>• Badge appears on the profile and on the search card immediately after issuance.<br>• Badge issuance and revocation are logged with actor, timestamp, and reason. | High Priority (Must) |
| **US 3.1 — Dual-tier mentor discovery & filtering** | As a mentee looking for guidance, I want to search and filter mentors by discipline, degree focus, tier, and overseas destination so that I find someone who understands both my research and my well-being needs. | <br>• Search supports keyword plus filters for academic discipline, degree level focus (S1/S2/S3), mentor tier (Basic, Educator Free-Marketplace, Premium Well-Being), and overseas study destination.<br>• Search cards display: mentor name, academic title, institution, verified badges (`SISTER Verified`, `Scopus/ORCID Verified`, `LMNS Well-Being Certified`), tier tag, research focus tags, and starting rate or free-consultation indicator.<br>• The "Premium Well-Being Mentors" toggle explains the added value (certified coaching plus holistic academic balance support).<br>• Zero-result searches render an empty state with the active filter set and a one-click clear-filters action.<br>• Only verified mentors appear; pending or rejected applications are never surfaced.<br>• Promotional page shows storefront outputs, verified links (Google Scholar, LinkedIn, ORCID/Scopus), well-being philosophy statement, and student reviews.<br>• Badges link out to the corresponding verification record where public (Scholar/LinkedIn/ORCID/Scopus). | High Priority (Must) |
| **US 4.1 — Platform fee checkout & pre-session mediation room** | As a mentee ready to book, I want to pay the LMNS platform fee to unlock a structured pre-session chat so that we align on expectations, deliverables, schedule, and direct payment terms before the session. | <br>• **Step 1 — Booking request:** mentee selects a mentor, completes a Session Intake Note (topic, current academic bottleneck, stress level), and pays the mandatory platform fee via QRIS, Virtual Account, or GoPay/OVO/Dana.<br>• Checkout displays the fee, what it covers, and the session fee basis for the selected tier before payment.<br>• Payment failure, abandonment, or timeout leaves the booking unpaid, gives a retry path, and never opens the mediation thread.<br>• Successful payment confirmation opens a dedicated **Pre-Session Mediation Thread** between mentee and mentor; contact details remain mediated until then.<br>• **Step 2/3 — Alignment Card** inside the thread requires both parties to confirm: (1) scope & academic deliverables, (2) session schedule & video link, (3) mentoring fee & direct settlement method (mutually agreed rate/bank/e-wallet for paid tiers, or explicit `Rp 0` for Free-Marketplace Educator sessions).<br>• Both parties must click **Confirm Agreement** before the booking moves to `Scheduled`; a one-sided confirmation leaves it pending and clearly labelled.<br>• The confirmed agreement is stored and visible to both parties; edits after confirmation require re-confirmation by both.<br>• Session-link and scheduling fields validate format and future date/time. | High Priority (Must) |
| **US 4.2 — Premium vs. standard value comparison at checkout** | As a mentee evaluating booking options, I want to compare what Premium includes versus standard tiers before paying so that I understand the extra value. | <br>• Checkout modal shows a tier comparison for the selected mentor.<br>• Premium perks listed: Certified Mental Health & Academic Burnout Coaching, Structured Post-Session Action & Well-Being Summary, Priority Response SLA in Mediation Chat, Curated Overseas/Doctoral Roadmap.<br>• Comparison uses the mentor's actual tier data; unavailable perks are not shown as included.<br>• Copy is consistent with what is enforced in the product — no unenforced promise may appear. | Medium Priority (Should) |
| **US 5.1 — Post-session academic & well-being reflection** | As a mentee who has completed a session, I want to rate my mentor on academic clarity and empathy/well-being support so that future students know which mentors uphold LMNS values. | <br>• Dual-axis 5-star prompt triggers 1 hour after session completion: (1) Academic & Research Guidance, (2) Psychological Safety & Well-Being Support.<br>• Prompt is delivered via notification/email deep link and remains available from the booking record if dismissed.<br>• Each axis is required independently; submission is blocked until both are rated.<br>• One-tap mood check ("How is your academic stress level after this session?") is presented after rating, and is optional.<br>• Reviews display as two separate ratings on the mentor page — never a single blended score.<br>• Review is tied to a completed booking; a mentee cannot review the same session twice.<br>• Free-text review is optional; profanity/PII filtering applies before publication. | High Priority (Must) |
| **US 5.2 — Admin credential & SISTER/Scopus verification console** | As an LMNS Operations Admin, I want to review mentor applications in one queue with direct verification links so that only legitimate academics and qualified well-being mentors are listed. | <br>• Queue lists applications with tier, submission date, SLA age, and status; sortable and filterable by tier and status.<br>• Each application flags missing credentials and invalid institutional domains.<br>• Direct links open SISTER, Scopus/ORCID, institutional page, Google Scholar, and LinkedIn records for the applicant.<br>• One-click approve/reject with templated feedback reasons; rejection requires selecting a reason.<br>• Premium badge issuance is available only when all Premium preconditions are shown as verified.<br>• Every decision records actor, timestamp, and reason in an audit log.<br>• Concurrency is safe: two admins cannot approve the same application twice.<br>• Applicant is notified of the decision with the stated reason. | High Priority (Must) |

## 9. Functional Requirements

| Feature | User Story & Expected Behavior | Design Reference | Priority |
|---|---|---|---|
| Student registration & email verification | US 1.1 — Domain allowlist check, OTP issuance/validation, academic profile capture (level, university, faculty/major, semester, goals). | `<!-- DATA NEEDED: Figma -->` | High |
| Mentee well-being baseline | US 1.2 — 3–5 Likert questions on stress, blockers, preferred tone; private storage; used only for matching; skippable and re-promptable. | `<!-- DATA NEEDED -->` | High |
| Mentor application wizard | US 2.1a/b/c — Tier selection, tier-specific evidence, mandatory well-being self-assessment, storefront builder; persisted progress; `Pending Admin Verification` with SLA. | `<!-- DATA NEEDED -->` | High |
| Premium upgrade & certification | US 2.2 — One-click upgrade, asynchronous training modules, assessment, certificate upload, automatic badge issuance on full verification. | `<!-- DATA NEEDED -->` | High |
| Marketplace search & filters | US 3.1 — Keyword + discipline, degree focus, tier, overseas destination filters; verified-only results; empty states; card badges. | `<!-- DATA NEEDED -->` | High |
| Mentor promotional page | US 3.1 — Storefront content, verified external links, well-being philosophy, dual-axis reviews. | `<!-- DATA NEEDED -->` | High |
| Booking & platform-fee checkout | US 4.1 — Session intake note, platform fee, QRIS/VA/GoPay/OVO/Dana, failure/retry states, idempotent confirmation. | `<!-- DATA NEEDED -->` | High |
| Pre-session mediation thread | US 4.1 — Thread unlocked only after payment; messaging between mentee and mentor. | `<!-- DATA NEEDED -->` | High |
| Alignment card & agreement lock | US 4.1 — Three-item bilateral checklist; both-party confirmation; booking to `Scheduled` only when confirmed; re-confirmation on edit. | `<!-- DATA NEEDED -->` | High |
| Tier comparison at checkout | US 4.2 — Premium perk comparison using the mentor's real tier data. | `<!-- DATA NEEDED -->` | Medium |
| Dual-axis review & mood check | US 5.1 — Trigger at +1h after completion; two independent ratings; optional mood check; dual display; one review per completed booking. | `<!-- DATA NEEDED -->` | High |
| Admin verification console | US 5.2 — Queue, missing-evidence flags, domain validation, external verification links, templated approve/reject, Premium badge management, audit log. | `<!-- DATA NEEDED -->` | High |
| Notification service | Emails for OTP, verification decisions, booking/agreement events, review prompts. | `<!-- DATA NEEDED -->` | High |

## 10. Technical Considerations

- **Integrations:** Indonesian payment gateways for QRIS, Virtual Account, and e-wallets (GoPay/OVO/Dana); transactional email/OTP delivery; external verification references (SISTER, Scopus, ORCID, Google Scholar, LinkedIn) accessed as links and admin-verified manually in the MVP. Partner selection and API contracts: `<!-- DATA NEEDED -->`.
- **Data & Privacy:** institutional email and academic profile are personal data; well-being pulse answers, session intake stress level, and post-session mood checks are sensitive and must be access-controlled, private to the mentee, and used only for matching/aggregate reporting. Verification evidence (diplomas, certificates) must be stored with restricted access and retention rules. Legal/privacy review is a release gate. `<!-- DATA NEEDED: retention period, data residency, DPIA ownership -->`
- **Scalability & Performance:** search must tolerate the Phase 2 supply cohort size and filter combinations without degraded latency; OTP and checkout endpoints must be idempotent and safe on retry; the verification queue must stay responsive under batch onboarding. Concrete load targets: `<!-- DATA NEEDED -->`.
- **Security:** role separation between mentee, mentor, and admin; badge issuance restricted to admin; audit log on all verification decisions; protection against review brigading (review bound to completed booking).
- **Risks & Dependencies:**
  - Manual verification throughput constrains supply launch (R-2 in the BRD).
  - Direct settlement in the Standard/Basic tracks means disputes occur off-platform; the stored agreement is the only evidence trail.
  - Well-being features must remain clearly non-clinical (R-4).
  - Payment gateway onboarding lead time gates Phase 3.
  - Product copy may not promise anything the system does not enforce — every listed Premium perk must map to an implemented behaviour.

## 11. Testing & Compliance (Checklist)

- [ ] QA test plan approved, covering registration/OTP, tier-gated applications, search filters, checkout failure modes, mediation lock, review dual-axis validation, admin queue.
- [ ] Negative-path tests for every acceptance criterion (invalid domain, expired OTP, missing tier evidence, unpaid booking attempting to open a thread, one-sided agreement confirmation, duplicate review).
- [ ] Admin verification rehearsal with real SISTER/Scopus/ORCID samples, including SLA timing.
- [ ] UAT with a pilot cohort of mentees and mentors across all three tiers.
- [ ] Privacy/legal review of institutional-email handling, well-being pulse data, mood-check data, and stored verification documents.
- [ ] Copy audit confirming non-clinical positioning and that no unenforced promise appears in product copy.
- [ ] Payment integration test in sandbox for QRIS, VA, and each e-wallet, including failure/refund paths. `<!-- DATA NEEDED: gateway sandbox access -->`
- [ ] Accessibility review of onboarding, checkout, and mediation screens. `<!-- DATA NEEDED: target standard, e.g. WCAG 2.1 AA -->`
- [ ] Well-being assessment and training content reviewed by a qualified professional before launch.

## 12. Timeline / Roadmap

| Phase | Deliverables | Deadline | Dependencies |
|---|---|---|---|
| **Phase 1 — MVP: Supply-Side Seeding** | Mentor application wizard and tier-specific verification (US 2.1), Premium upgrade with well-being training and badge issuance (US 2.2), admin verification console with SISTER/Scopus/ORCID review and badge management (US 5.2) | `<!-- DATA NEEDED -->` | Well-being training curriculum; ops staffing for 2–3 day SLA; legal review of stored credentials |
| **Phase 2 — Demand-Side & Discovery** | `.ac.id`/`.edu` student registration with OTP and academic profile (US 1.1), well-being baseline pulse (US 1.2), filterable mentor marketplace and promotional pages (US 3.1) | `<!-- DATA NEEDED -->` | Phase 1 verified supply; institutional domain allowlist; discovery ranking and matching inputs from pulse data |
| **Phase 3 — Mediation & Monetisation** | Platform-fee checkout via QRIS/VA/e-wallet, pre-session mediation thread and alignment card (US 4.1), Premium vs. standard comparison at checkout (US 4.2), dual-axis reviews and mood check (US 5.1) | `<!-- DATA NEEDED -->` | Payment gateway merchant accounts; Phase 2 complete; agreed fee policy and refund rules |

## 13. Attachments

- `user_stories.md` — LMNS User Story Specification (source input)
- `business_requirement.md` — Business Requirements Document (BR-01 … BR-15)
- `<!-- DATA NEEDED: Business Model Canvas, product flow diagram, market research, Figma designs, integration documentation -->`

---

## Appendix A — Requirement Traceability

| Source Story | BRD Requirement | PRD Section |
|---|---|---|
| US 1.1 | BR-01, BR-02 | §8, §9 |
| US 1.2 | BR-03 | §8, §9 |
| US 2.1 | BR-04, BR-05, BR-06, BR-07 | §8, §9 |
| US 2.2 | BR-08 | §8, §9 |
| US 3.1 | BR-09 | §8, §9 |
| US 4.1 | BR-10, BR-11, BR-15 | §8, §9 |
| US 4.2 | BR-12 | §8, §9 |
| US 5.1 | BR-13 | §8, §9 |
| US 5.2 | BR-07, BR-14 | §8, §9 |
