# API Contract

Contract between `apps/api` and `apps/web`. Both sides build against this document; if an endpoint is missing or wrong, change this file in the same PR that changes the code.

- Base URL: `http://localhost:3001/api` (the web app calls `/api/...` through the Vite proxy).
- Every endpoint below is required by at least one of the 11 prototype stories; §14 maps stories to endpoints.
- State machines referenced here are defined in `docs/data-model.md`.

## 1. Conventions

| Item | Rule |
|---|---|
| Content type | `application/json` for all requests and responses. |
| Auth | `Authorization: Bearer <token>` from `POST /api/auth/login` or `POST /api/auth/register/verify`. |
| Roles | `MENTEE`, `MENTOR`, `ADMIN`. Role always comes from the session, never from the body. |
| Money | Integer rupiah, e.g. `50000`. Never pre-formatted. |
| Timestamps | ISO-8601 UTC, e.g. `2026-11-01T00:00:00.000Z`. |
| Pagination | `?page=1&pageSize=12` (max 50) → `{ "items": [], "page": 1, "pageSize": 12, "total": 0 }`. |
| Enums | `UPPER_SNAKE_CASE`. Tier display names are **not** enums; they are served from `/api/config` as `tierLabels`. |
| Idempotency | Documented per endpoint. Payment confirmation is idempotent; every other write is not. |
| Demo mode | No endpoint sends email, calls a gateway, or stores a binary upload. `GET /api/config` sets `demoMode: true`. |

## 2. Error envelope and codes

```json
{ "error": { "code": "EVIDENCE_MISSING", "message": "Bukti kredensial belum lengkap.", "details": { "missingItems": ["sisterId"] } } }
```

| HTTP | `code` | When | `details` |
|---|---|---|---|
| 400 | `MALFORMED_JSON` | Body is not valid JSON | — |
| 401 | `UNAUTHENTICATED` | Missing/invalid bearer token | — |
| 401 | `INVALID_CREDENTIALS` | Login email is not a seeded account | — |
| 403 | `ROLE_FORBIDDEN` | Session role cannot use this endpoint | `{ "requiredRole": "ADMIN" }` |
| 403 | `MENTEE_NOT_VERIFIED` | Booking attempted before email verification | `{ "email": "…" }` |
| 403 | `FORBIDDEN` | Actor is not the owner/participant of the resource | — |
| 404 | `NOT_FOUND` | Unknown route or resource | — |
| 404 | `MENTOR_NOT_LISTED` | Public profile requested for a non-approved mentor | — |
| 402 | `PAYMENT_REQUIRED` | Mediation access before the platform fee is paid | `{ "bookingId": "…", "status": "AWAITING_PAYMENT" }` |
| 409 | `EMAIL_ALREADY_REGISTERED` | Registration on an existing email | `{ "suggest": "SIGN_IN" }` |
| 409 | `APPLICATION_IN_PROGRESS` | A second application draft is started | `{ "applicationId": "…" }` |
| 409 | `INVALID_APPLICATION_STATE` | Step not allowed in the current state | `{ "status": "PENDING_REVIEW" }` |
| 409 | `APPLICATION_ALREADY_DECIDED` | Concurrent admin decision | `{ "decidedBy": "usr_reviewer" }` |
| 409 | `THREAD_CLOSED` | Message on a cancelled/completed thread | `{ "bookingStatus": "CANCELLED" }` |
| 409 | `ALIGNMENT_INCOMPLETE` | Scheduling attempted before bilateral confirmation | `{ "pendingItems": ["scope"] }` |
| 409 | `REVIEW_NOT_ELIGIBLE` | Review before `reviewEligibleAt` | `{ "reviewEligibleAt": "…" }` |
| 409 | `REVIEW_ALREADY_SUBMITTED` | Second review for the same booking | `{ "reviewId": "…" }` |
| 409 | `TRAINING_INCOMPLETE` | Assessment attempted before all modules are complete | `{ "remainingModules": ["m3"] }` |
| 409 | `BADGE_PRECONDITIONS_UNMET` | Badge issue before all conditions verified | `{ "missing": ["overseasExperience", "certificate"] }` |
| 410 | `OTP_EXPIRED` | OTP challenge expired (15 min) | `{ "resendAvailable": true }` |
| 422 | `VALIDATION_ERROR` | Field-level validation failure | `{ "fields": { "email": "Format email tidak valid." } }` |
| 422 | `DOMAIN_NOT_ALLOWED` | Email domain outside the allowlist | `{ "allowedDomains": ["ac.id", "edu"] }` |
| 422 | `EVIDENCE_MISSING` | Submit with tier-required evidence missing | `{ "missingItems": ["scopusId"] }` |
| 422 | `SELF_ASSESSMENT_REQUIRED` | Submit without the well-being self-assessment | — |
| 422 | `STOREFRONT_INCOMPLETE` | Standard/Premium submit without a package | `{ "missingItems": ["packages"] }` |
| 422 | `PACKAGE_INVALID` | Package price/duration outside allowed bounds | `{ "fields": … }` |
| 422 | `REASON_REQUIRED` | Rejection without a templated reason | `{ "allowedReasons": ["MISSING_EVIDENCE", "…"] }` |
| 429 | `OTP_RATE_LIMITED` | More than 3 resends per 15 min per email | `{ "retryAfterSeconds": 420 }` |
| 500 | `INTERNAL_ERROR` | Unhandled server error | — |
| 503 | `DATABASE_UNAVAILABLE` | SQLite cannot be opened | — |

`message` is Indonesian copy and safe to render. Clients branch on `code`.

## 3. Shared object shapes

```jsonc
User            { "id": "usr_rani", "email": "rani@ui.ac.id", "role": "MENTEE", "emailVerifiedAt": "2026-11-01T00:00:00.000Z" }

MenteeProfile   { "userId": "usr_rani", "academicLevel": "S1", "university": "Universitas Indonesia",
                  "facultyMajor": "Ilmu Komputer / Sistem Informasi", "semester": 6,
                  "goals": ["Thesis Anxiety", "Research Methodology"],
                  "onboardingCompletedAt": "2026-11-01T00:00:00.000Z" }

MentorCard      { "id": "usr_adi", "slug": "adi-prasetyo", "displayName": "Dr. Adi Prasetyo",
                  "academicTitle": "Dosen Ilmu Komputer", "institution": "Universitas Indonesia",
                  "discipline": "Computer Science", "tier": "EDUCATOR_PREMIUM",
                  "tierLabel": "Premium Educator Mentor",
                  "badges": [{ "type": "SISTER_VERIFIED", "label": "SISTER Verified" },
                             { "type": "SCOPUS_ORCID_VERIFIED", "label": "Scopus/ORCID Verified" },
                             { "type": "LMNS_WELL_BEING_CERTIFIED", "label": "LMNS Well-Being Certified" }],
                  "researchFocus": ["Machine Learning", "Sistem Terdistribusi"],
                  "languages": ["id", "en"], "formats": ["online"],
                  "overseasDestinations": ["NL"],
                  "startingFeeIdr": 250000, "freeConsultation": false,
                  "rating": { "academicGuidance": 4.8, "wellBeingSupport": 4.6, "reviewCount": 12 } }

MentorProfile   extends MentorCard with:
                { "intro": "…", "introVideoUrl": null, "wellBeingPhilosophy": "…",
                  "strengths": ["Metodologi kualitatif", "Penulisan jurnal"],
                  "verifiedLinks": { "googleScholar": "https://…", "linkedin": "https://…",
                                     "scopus": "https://…", "orcid": null,
                                     "institutional": "https://…", "sisterId": "0123456789" },
                  "packages": [Package] }

Package         { "id": "pkg_adi_1", "title": "Konsultasi Tesis 60 menit", "description": "…",
                  "durationMinutes": 60, "priceIdr": 250000, "isFreeConsultation": false }

Application     { "id": "app_hendra", "mentorId": "usr_hendra", "tier": "BASIC",
                  "tierLabel": "Basic Mentor", "status": "PENDING_REVIEW",
                  "currentStep": "STORE_FRONT", "submittedAt": "2026-11-10T02:00:00.000Z",
                  "slaDueAt": "2026-11-13T02:00:00.000Z",
                  "decidedAt": null, "decisionReasonCode": null, "decisionNote": null,
                  "evidence": { "degreeUrl": "https://…", "overseasExperienceUrl": "https://…",
                                "organisationUrl": "https://…", "googleScholarUrl": "https://…",
                                "linkedinUrl": "https://…" },
                  "missingItems": [{ "key": "scopusId", "label": "Scopus ID / ORCID" }],
                  "selfAssessment": { "philosophy": "…", "boundaries": "…", "burnoutApproach": "…" },
                  "storefront": Storefront,
                  "history": [{ "status": "DRAFT", "at": "2026-11-09T01:00:00.000Z", "actorId": "usr_hendra" }] }

Storefront      { "niche": "Metodologi penelitian kualitatif", "strengths": ["…"],
                  "languages": ["id", "en"], "formats": ["online", "in-person"],
                  "intro": "…", "introVideoUrl": null, "wellBeingPhilosophy": "…",
                  "packages": [Package], "published": false }

Booking         { "id": "bkg_rani_sari_1", "menteeId": "usr_rani", "mentorId": "usr_sari",
                  "mentor": MentorCard, "tier": "EDUCATOR_STANDARD",
                  "tierLabel": "Educator Mentor", "sessionFeeBasis": "RP_0",
                  "status": "PAID", "platformFeeIdr": 50000, "paymentStatus": "SUCCEEDED",
                  "intakeNote": { "topic": "…", "bottleneck": "…", "stressLevel": 3 },
                  "createdAt": "…", "paidAt": "…", "scheduledAt": null,
                  "completedAt": null, "reviewEligibleAt": null, "threadId": "thr_rani_sari_1" }
                // `intakeNote.stressLevel` is present ONLY for the owning mentee.

Payment         { "id": "pay_1", "bookingId": "bkg_1", "provider": "QRIS",
                  "ewallet": null, "amountIdr": 50000, "status": "SUCCEEDED",
                  "failureCode": null, "expiresAt": "…", "paidAt": "…",
                  "instructions": { "qrString": "DEMO-QRIS-…", "virtualAccount": null } }

AlignmentCard   { "bookingId": "bkg_1", "version": 3, "status": "PARTIAL",
                  "items": [
                    { "key": "scope", "label": "Ruang lingkup & hasil akademik",
                      "value": { "text": "…" }, "version": 2,
                      "proposedBy": "usr_rani", "proposedAt": "…",
                      "confirmations": { "mentee": true, "mentor": false },
                      "confirmed": false },
                    { "key": "schedule", "label": "Jadwal & tautan sesi",
                      "value": { "startsAt": "2026-12-01T10:00:00.000Z", "durationMinutes": 60,
                                 "videoUrl": "https://meet.example.com/…" },
                      "version": 1, "proposedBy": "usr_sari", "proposedAt": "…",
                      "confirmations": { "mentee": true, "mentor": true }, "confirmed": true },
                    { "key": "fee", "label": "Biaya sesi & metode pembayaran",
                      "value": { "amountIdr": 0, "method": "FREE_CONSULTATION" },
                      "version": 1, "proposedBy": "usr_sari", "proposedAt": "…",
                      "confirmations": { "mentee": false, "mentor": true }, "confirmed": false }
                  ] }

ReviewPublic    { "id": "rev_1", "academicGuidance": 5, "wellBeingSupport": 4,
                  "comment": "…", "createdAt": "…", "menteeInitial": "R." }
                // Public reviews never include mood checks, stress levels, or the mentee's identity.

AdminQueueItem  { "application": Application, "mentorEmail": "hendra@ugm.ac.id",
                  "slaAgeHours": 41, "flags": ["MISSING_SCOPUS_ID", "DOMAIN_NOT_ALLOWED"] }
```

## 4. Platform

### `GET /api/health` — public
`200` `{ "status": "ok", "service": "lmns-api", "version": "0.1.0", "database": { "status": "ok", "seededAt": "2026-11-01T00:00:00.000Z", "users": 14, "mentors": 10 } }` · `503` when the database fails.

### `GET /api/config` — public
`200`

```json
{
  "platformFeeIdr": 50000,
  "tierLabels": {
    "BASIC": "Basic Mentor",
    "EDUCATOR_STANDARD": "Educator Mentor",
    "EDUCATOR_PREMIUM": "Premium Educator Mentor"
  },
  "allowedEmailDomains": ["ac.id", "edu"],
  "demoMode": true,
  "disclaimer": "Prototipe demo: pembayaran disimulasikan, OTP ditampilkan langsung, dan tidak ada layanan klinis."
}
```

Every fee/tier string in the UI is rendered from this response. Error: `503 DATABASE_UNAVAILABLE`.

## 5. Auth, registration, OTP (US 1.1)

### `POST /api/auth/login` — public
Demo sign-in. Only seeded accounts work; no password.

Request `{ "email": "rani@ui.ac.id" }`
Response `200` `{ "token": "ses_…", "user": User, "menteeProfile": MenteeProfile | null, "mentorProfile": MentorCard | null }`
Errors: `401 INVALID_CREDENTIALS`, `422 VALIDATION_ERROR`.

### `POST /api/auth/logout` — any role
`200 { "ok": true }`. Deletes the session token. `401 UNAUTHENTICATED`.

### `GET /api/auth/me` — any role
`200`

```json
{
  "user": User,
  "menteeProfile": MenteeProfile | null,
  "mentorProfile": MentorCard | null,
  "permissions": ["booking:create", "application:write"]
}
```

`401 UNAUTHENTICATED`.

### `POST /api/auth/register` — public
Creates an unverified mentee and issues an OTP challenge.

```json
{ "email": "rani@ui.ac.id", "academicLevel": "S1", "university": "Universitas Indonesia",
  "facultyMajor": "Ilmu Komputer", "semester": 6,
  "goals": ["Thesis Anxiety", "Research Methodology"] }
```

Response `201`

```json
{ "userId": "usr_new", "email": "rani@ui.ac.id", "emailVerified": false,
  "otp": { "required": true, "expiresAt": "2026-11-01T00:15:00.000Z", "demoOtp": "123456" } }
```

Errors: `422 DOMAIN_NOT_ALLOWED` (form state preserved client-side), `422 VALIDATION_ERROR` (unknown goal/level, semester out of 1–14), `409 EMAIL_ALREADY_REGISTERED`, `429 OTP_RATE_LIMITED`.

`goals` accepts one or more of: `Thesis Anxiety`, `Overseas Scholarship Prep`, `Research Methodology`, `Burnout Prevention`, `Publication Support`, `Career in Academia`.

### `POST /api/auth/register/verify` — public
`{ "email": "rani@ui.ac.id", "otp": "123456" }` → `200 { "token": "ses_…", "user": User, "menteeProfile": MenteeProfile }`

Errors: `410 OTP_EXPIRED`, `422 VALIDATION_ERROR` (wrong/reused OTP), `404 NOT_FOUND`.

### `POST /api/auth/otp/resend` — public
`{ "email": "rani@ui.ac.id" }` → `202 { "expiresAt": "…", "demoOtp": "123456", "resendsRemaining": 2 }`
Errors: `429 OTP_RATE_LIMITED` (3 per 15 min), `404 NOT_FOUND`.

## 6. Mentee profile and pulse (US 1.1, US 1.2)

### `GET /api/me/mentee` — `MENTEE`
`200 MenteeProfile`. `403 ROLE_FORBIDDEN` for other roles.

### `PATCH /api/me/mentee` — `MENTEE`
Partial update; used by onboarding and profile edit.

```json
{ "academicLevel": "S2", "university": "Universitas Gadjah Mada",
  "facultyMajor": "Ilmu Lingkungan", "semester": 2, "goals": ["Research Methodology"] }
```

`200 MenteeProfile`. `academicLevel` and at least one goal are required before `onboardingCompletedAt` is set. `422 VALIDATION_ERROR`.

### `POST /api/me/pulses` — `MENTEE`
Appends a pulse submission; previous submissions are retained (history, never overwritten).

```json
{ "answers": { "workloadStress": 4, "researchBlocker": 3, "preferredTone": "STRUCTURED" } }
```

`skipped: true` may be sent instead of `answers`. Response `201`

```json
{ "id": "pulse_citra_2", "answers": { … }, "skipped": false, "createdAt": "…" }
```

`422 VALIDATION_ERROR` (each Likert value 1–5; `preferredTone` ∈ `GENTLE`, `STRUCTURED`).
Pulse data is never returned by any mentor or admin endpoint.

### `GET /api/me/pulses` — `MENTEE`
`200 { "items": [Pulse], "page": 1, "pageSize": 12, "total": 2 }` — newest first, owner only.

### `GET /api/me/pulses/latest` — `MENTEE`
`200 Pulse | null`.

## 7. Mentor application (US 2.1a/b/c)

Application states are defined in `docs/data-model.md` §4.1. All routes below are `MENTOR` only (`403 ROLE_FORBIDDEN` otherwise) and owner-scoped (`403 FORBIDDEN` for another mentor's application).

### `POST /api/mentor/applications`
`{ "tier": "BASIC" }` → `201 Application` (status `DRAFT`, `currentStep: "IDENTITY"`).
Errors: `409 APPLICATION_IN_PROGRESS`, `422 VALIDATION_ERROR` (unknown tier).

### `GET /api/mentor/applications/current`
`200 Application | null`. Includes `missingItems` for the current step and `slaDueAt` once submitted.

### `GET /api/mentor/applications/:id`
`200 Application`. `404 NOT_FOUND`.

### `PATCH /api/mentor/applications/:id/identity`
Tier-specific evidence. Unknown keys for the selected tier are rejected, not stored.

```json
{
  "displayName": "Hendra Kusuma, M.Sc.", "academicTitle": "Peneliti Teknik Sipil",
  "institution": "Universitas Gadjah Mada", "discipline": "Engineering",
  "evidence": {
    "degreeUrl": "https://drive.example.com/ijazah.pdf",
    "overseasExperienceUrl": "https://example.com/letter.pdf",
    "organisationUrl": "https://ugm.ac.id/…",
    "googleScholarUrl": "https://scholar.google.com/citations?user=…",
    "linkedinUrl": "https://www.linkedin.com/in/…"
  }
}
```

Per-tier required evidence keys:

| Tier | Required evidence keys |
|---|---|
| `BASIC` | `degreeUrl`, `overseasExperienceUrl`, `organisationUrl`, `googleScholarUrl`, `linkedinUrl` |
| `EDUCATOR_STANDARD` | `s3VerificationUrl`, `sisterId`, `institutionalEmailVerified`, `googleScholarUrl`, `linkedinUrl` |
| `EDUCATOR_PREMIUM` | `s3VerificationUrl`, `overseasExperienceUrl`, `scopusId` **or** `orcidId`, `googleScholarUrl`, `linkedinUrl`, `certificateUrl` |

Format rules: every `*Url` must be `https?://`; `sisterId` is 10 digits (`^\d{10}$`); `scopusId` is digits; `orcidId` matches `^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$`. `institutionalEmailVerified` must be `true` (the OTP in §5 uses the same account email).
`200 Application`. Errors: `422 VALIDATION_ERROR` with `details.fields` (field-level, per AC), `409 INVALID_APPLICATION_STATE` once submitted.

### `PUT /api/mentor/applications/:id/self-assessment`
Mandatory for every tier; not published.

```json
{ "philosophy": "…", "boundaries": "…", "burnoutApproach": "…" }
```

Each field 40–1200 characters. `200 Application`. `422 VALIDATION_ERROR`.

### `PUT /api/mentor/applications/:id/storefront`
```json
{
  "niche": "Metodologi penelitian kualitatif", "strengths": ["Analisis tematik"],
  "languages": ["id", "en"], "formats": ["online", "in-person"],
  "intro": "…", "introVideoUrl": null,
  "wellBeingPhilosophy": "…",
  "packages": [
    { "title": "Konsultasi 60 menit", "description": "…", "durationMinutes": 60,
      "priceIdr": 0, "isFreeConsultation": true }
  ]
}
```

Limits: `niche` ≤ 80 chars, `intro` ≤ 800, each strength ≤ 60, max 6 strengths, max 5 packages, `durationMinutes` 30–180, `priceIdr` 0–5,000,000. At least one package is required for `EDUCATOR_STANDARD` and `EDUCATOR_PREMIUM` at submit time. `200 Application`.
Errors: `422 VALIDATION_ERROR`, `422 PACKAGE_INVALID`.

### `POST /api/mentor/applications/:id/submit`
No body. Runs the tier checklist; on success `200`

```json
{ "id": "app_hendra", "status": "PENDING_REVIEW",
  "submittedAt": "2026-11-10T02:00:00.000Z", "slaDueAt": "2026-11-13T02:00:00.000Z",
  "missingItems": [] }
```

Errors: `422 EVIDENCE_MISSING` (`details.missingItems`), `422 SELF_ASSESSMENT_REQUIRED`, `422 STOREFRONT_INCOMPLETE`, `409 INVALID_APPLICATION_STATE` (already submitted/approved).

### `POST /api/mentor/applications/:id/withdraw`
`200 { "id": "…", "status": "WITHDRAWN" }`. Allowed from `PENDING_REVIEW`; a rejected application may be edited and resubmitted instead (`REJECTED → DRAFT` happens on the next `PATCH`). `409 INVALID_APPLICATION_STATE` after a decision when the application is approved.

### `GET /api/mentor/dashboard` — `MENTOR`
`200`

```json
{
  "application": Application | null,
  "mentor": MentorCard | null,
  "upgrade": UpgradeStatus | null,
  "stats": { "upcomingBookings": 1, "pendingAgreements": 2, "completedSessions": 8 }
}
```

## 8. Storefront editing after approval (US 2.1c)

### `GET /api/mentor/storefront` — `MENTOR`
`200 Storefront`. `403 FORBIDDEN` while the application is not approved (a mentor cannot edit an unpublished storefront).

### `PUT /api/mentor/storefront` — `MENTOR`
Same body and validation as `PUT /api/mentor/applications/:id/storefront`; changes publish immediately for approved mentors. `200 Storefront`.

## 9. Premium upgrade and training (US 2.2)

```jsonc
UpgradeStatus {
  "currentTier": "EDUCATOR_STANDARD",
  "targetTier": "EDUCATOR_PREMIUM",
  "eligible": false,
  "checklist": [
    { "key": "training",       "label": "Pelatihan Well-Being LMNS", "status": "IN_PROGRESS", "detail": "2 dari 4 modul selesai" },
    { "key": "assessment",     "label": "Asesmen pemahaman",         "status": "PENDING",     "detail": null },
    { "key": "s3",             "label": "Verifikasi S3",             "status": "VERIFIED",    "detail": null },
    { "key": "overseas",       "label": "Pengalaman luar negeri",    "status": "VERIFIED",    "detail": null },
    { "key": "certificate",    "label": "Sertifikat coaching",       "status": "PENDING",     "detail": null }
  ],
  "assessment": { "score": null, "passed": false, "attemptsUsed": 0, "attemptsRemaining": 3 }
}
```

Checklist `status` ∈ `PENDING`, `IN_PROGRESS`, `VERIFIED`, `REJECTED`.

### `GET /api/mentor/upgrade` — `MENTOR`
`200 UpgradeStatus`. For `EDUCATOR_PREMIUM` mentors `targetTier` is `null` and `eligible` is `true`.

### `GET /api/training/modules` — `MENTOR`
`200 { "items": [{ "id": "m1", "title": "Empati dalam mentoring akademik", "durationMinutes": 12, "completed": true }], "total": 4 }`

### `GET /api/training/modules/:id` — `MENTOR`
`200 { "id": "m1", "title": "…", "content": "…", "durationMinutes": 12, "completed": true, "completedAt": "…" }`
`404 NOT_FOUND`.

### `POST /api/training/modules/:id/complete` — `MENTOR`
No body → `200 { "moduleId": "m1", "completed": true, "completedAt": "…", "modulesRemaining": 3 }`. Idempotent.

### `POST /api/mentor/upgrade/assessment` — `MENTOR`
```json
{ "answers": [{ "questionId": "q1", "choice": 2 }, { "questionId": "q2", "choice": 0 }] }
```
`200 { "score": 80, "passed": true, "attemptsUsed": 1, "attemptsRemaining": 2, "retakeAvailableAt": null }`
A failed attempt returns `passed: false` with the score and `retakeAvailableAt` (next attempt after 10 minutes; 3 attempts per day). `409 TRAINING_INCOMPLETE` when modules remain.

### `POST /api/mentor/upgrade/certificate` — `MENTOR`
File **metadata** only (no binary storage):
```json
{ "fileName": "sertifikat-coaching.pdf", "issuer": "LMNS", "issuedAt": "2026-10-01", "expiresAt": "2028-10-01" }
```
`201 { "id": "cert_1", "status": "PENDING_VERIFICATION", "fileName": "…", "uploadedAt": "…" }`
`422 VALIDATION_ERROR` (fileName extension not `pdf|jpg|png`, `expiresAt` in the past).

### `POST /api/mentor/upgrade/submit` — `MENTOR`
No body. Freezes the upgrade request for admin review → `202 { "upgradeRequestId": "upr_1", "status": "PENDING_VERIFICATION", "checklist": […] }`.
Errors: `409 TRAINING_INCOMPLETE`, `409 BADGE_PRECONDITIONS_UNMET` (`details.missing` lists unverified academic conditions).

Badge issuance is **automatic** when the admin verifies the certificate while training/assessment/S3/overseas are verified (US 2.2). The mentor's `tier` becomes `EDUCATOR_PREMIUM` and the badge appears on cards and the public profile immediately.

## 10. Discovery and public profile (US 3.1)

### `GET /api/mentors` — public
| Query | Type | Notes |
|---|---|---|
| `q` | string ≤ 100 | Matches display name, institution, discipline, niche, research focus. |
| `discipline` | repeatable | e.g. `Computer Science`. |
| `degreeFocus` | repeatable | `S1`, `S2`, `S3`. |
| `tier` | repeatable | `BASIC`, `EDUCATOR_STANDARD`, `EDUCATOR_PREMIUM`. |
| `destination` | repeatable | Overseas destination code, e.g. `NL`, `AU`, `JP`, `UK`, `US`, `SG`. |
| `language` | repeatable | `id`, `en`. |
| `format` | repeatable | `online`, `in-person`. |
| `maxFeeIdr` | integer | Starting-fee ceiling; free consultations always match. |
| `sort` | enum | `relevance` (default), `rating`, `price_asc`, `price_desc`. |
| `page`, `pageSize` | int | §1. |

`200`

```json
{
  "items": [MentorCard],
  "page": 1, "pageSize": 12, "total": 8,
  "appliedFilters": { "tier": ["EDUCATOR_PREMIUM"], "discipline": [] },
  "emptyResult": false
}
```

Only mentors with approval status `APPROVED` and a verified account appear (G2). A query with no matches returns `items: []`, `total: 0`, `emptyResult: true` — the web renders the empty state with `appliedFilters` and a clear-filters action.

### `GET /api/mentors/facets` — public
`200 { "disciplines": [{ "value": "Computer Science", "label": "Computer Science", "count": 3 }], "degreeFocus": [...], "tiers": [{ "value": "EDUCATOR_PREMIUM", "label": "Premium Educator Mentor", "count": 2 }], "destinations": [...], "languages": [...], "formats": [...] }`
Counts reflect approved mentors only.

### `GET /api/mentors/:slug` — public
`200 MentorProfile` plus `"reviews": { "aggregates": { "academicGuidance": 4.8, "wellBeingSupport": 4.6, "reviewCount": 12 }, "recent": [ReviewPublic] }`
Errors: `404 MENTOR_NOT_LISTED` for pending/rejected/unknown mentors.

### `GET /api/mentors/:slug/reviews` — public
`?page&pageSize` → `200 { "items": [ReviewPublic], "page": 1, "pageSize": 12, "total": 12, "aggregates": { "academicGuidance": 4.8, "wellBeingSupport": 4.6, "reviewCount": 12 } }`
The two axes are always separate fields; there is no `average` or blended score anywhere in the API.

## 11. Booking, checkout, mock payment (US 4.1, US 4.2)

Booking statuses: `AWAITING_PAYMENT`, `PAYMENT_FAILED`, `PAID`, `SCHEDULED`, `COMPLETED`, `REVIEWED`, `CANCELLED` (`docs/data-model.md` §4.2).

### `GET /api/mentors/:slug/booking-options` — `MENTEE`
Powers the checkout screen, including US 4.2 comparison.

```json
{
  "mentor": MentorCard,
  "platformFeeIdr": 50000,
  "platformFeeCovers": ["Verifikasi kredensial mentor", "Ruang mediasi pra-sesi", "Penanganan sengketa"],
  "sessionFeeBasis": "RP_0",
  "sessionFeeNote": "Sesi Educator Mentor ini gratis; biaya platform tetap berlaku.",
  "packages": [Package],
  "comparison": {
    "currentTier": "EDUCATOR_STANDARD",
    "premiumTier": "EDUCATOR_PREMIUM",
    "rows": [
      { "perk": "Certified Mental Health & Academic Burnout Coaching", "included": false, "reason": "Hanya untuk mentor Premium Educator" },
      { "perk": "Structured Post-Session Action & Well-Being Summary", "included": false, "reason": "Hanya untuk mentor Premium Educator" },
      { "perk": "Priority Response SLA in Mediation Chat", "included": false, "reason": "Hanya untuk mentor Premium Educator" },
      { "perk": "Curated Overseas/Doctoral Roadmap", "included": false, "reason": "Hanya untuk mentor Premium Educator" }
    ]
  }
}
```

`sessionFeeBasis` ∈ `RP_0` | `AGREED_IN_MEDIATION` | `PACKAGE_PRICE`. For a Premium mentor, `included` is `true` only for perks the mentor actually has verified. `404 MENTOR_NOT_LISTED`.

### `POST /api/bookings` — `MENTEE`
```json
{ "mentorId": "usr_sari", "packageId": null,
  "intakeNote": { "topic": "Bab 3 metodologi", "bottleneck": "Belum menemukan kerangka analisis", "stressLevel": 4 } }
```
`201`

```json
{ "booking": Booking, "payment": Payment }
```

The platform fee is read from config, never from the request. Errors: `403 MENTEE_NOT_VERIFIED` (G1), `404 MENTOR_NOT_LISTED`, `422 VALIDATION_ERROR` (topic ≤ 200, bottleneck ≤ 500, stressLevel 1–5, package must belong to the mentor), `409 CONFLICT` when an unpaid/paid booking with the same mentor is already open (`details.existingBookingId`).

### `GET /api/bookings` — `MENTEE` | `MENTOR`
`?role=mentee|mentor&status=…&page&pageSize` (role defaults to the session role). Returns bookings where the caller is the mentee or the mentor.
`200 { "items": [Booking], "page": 1, "pageSize": 12, "total": 1 }`

### `GET /api/bookings/:id` — participant (`MENTEE`/`MENTOR`) or `ADMIN`
`200 Booking`. Redaction (G6): the mentor variant omits `intakeNote.stressLevel`; the admin variant omits it too. `403 FORBIDDEN` for non-participants.

### `POST /api/bookings/:id/payments` — `MENTEE` (owner)
Starts a mock payment.

```json
{ "provider": "QRIS", "ewallet": null, "testOutcome": "SUCCESS" }
```

- `provider` ∈ `QRIS`, `VIRTUAL_ACCOUNT`, `EWALLET`; `ewallet` required for `EWALLET` and one of `GOPAY`, `OVO`, `DANA`.
- `testOutcome` is a demo-only switch: `SUCCESS` (default) or `FAILURE`.

`201 Payment`. Errors: `409 CONFLICT` when the booking is already paid/cancelled (`details.bookingStatus`), `422 VALIDATION_ERROR`.

### `POST /api/bookings/:id/payments/:paymentId/confirm` — `MENTEE` (owner)
Simulates gateway callback. **Idempotent**: repeating with the same payment returns the same `200`.

```json
{ "booking": Booking, "payment": Payment, "receipt": { "receiptNumber": "LMNS-2026-0001", "paidAt": "…", "platformFeeIdr": 50000, "covers": ["…"] } }
```

On success the booking moves `AWAITING_PAYMENT|PAYMENT_FAILED → PAID` and the mediation thread is created. Failure keeps the booking `PAYMENT_FAILED` with a retry path (`testOutcome` again). Errors: `404 NOT_FOUND`, `409 CONFLICT` (payment belongs to another booking), `402` is **not** used here.

### `POST /api/bookings/:id/cancel` — participant
`{ "reason": "Jadwal bentrok" }` → `200 { "booking": Booking, "refund": { "platformFeeRefunded": false, "note": "Kebijakan refund di luar cakupan prototipe." } }`
Allowed from `AWAITING_PAYMENT`, `PAYMENT_FAILED`, `PAID`, `SCHEDULED`. `409 CONFLICT` after `COMPLETED`.

### `GET /api/bookings/:id/receipt` — participant
`200 { "receiptNumber": "…", "issuedAt": "…", "platformFeeIdr": 50000, "sessionFeeBasis": "RP_0", "covers": ["…"], "disclaimer": "…" }`. `402 PAYMENT_REQUIRED` before payment.

## 12. Mediation and alignment card (US 4.1)

Thread access requires `booking.status` ∈ `PAID`/`SCHEDULED`/`COMPLETED`/`REVIEWED`; otherwise `402 PAYMENT_REQUIRED` (G3). Participant-only (`403 FORBIDDEN`).

### `GET /api/bookings/:id/thread`
`200`

```json
{
  "threadId": "thr_1", "bookingId": "bkg_1", "openedAt": "…",
  "participants": [{ "id": "usr_rani", "role": "MENTEE", "displayName": "Rani" },
                   { "id": "usr_sari", "role": "MENTOR", "displayName": "Dr. Sari Wulandari" }],
  "contactPolicy": "Kontak langsung baru dibuka setelah biaya platform dibayar. Jangan bertukar kontak di luar kanal ini.",
  "messages": [Message], "alignment": AlignmentCard
}
```

```jsonc
Message { "id": "msg_1", "threadId": "thr_1", "senderId": "usr_rani", "senderRole": "MENTEE", "body": "…", "createdAt": "…" }
```

### `POST /api/bookings/:id/messages` — participant
`{ "body": "Halo Dok, saya ingin memastikan ruang lingkup." }` (1–2000 chars) → `201 Message`.
Errors: `402 PAYMENT_REQUIRED`, `409 THREAD_CLOSED`, `422 VALIDATION_ERROR`.

### `GET /api/bookings/:id/alignment` — participant
`200 AlignmentCard`.

### `PUT /api/bookings/:id/alignment/:itemKey` — participant
`itemKey` ∈ `scope`, `schedule`, `fee`. Writes a new item version, clears **both** confirmations for that item, and returns the booking to `PAID` if it was `SCHEDULED`.

```jsonc
// scope
{ "text": "Review Bab 3, 2 sesi, catatan tertulis maksimal 3 hari setelah sesi." }
// schedule
{ "startsAt": "2026-12-01T10:00:00.000Z", "durationMinutes": 60, "videoUrl": "https://meet.example.com/abc" }
// fee  (free tier must be explicit)
{ "amountIdr": 0, "method": "FREE_CONSULTATION" }
// fee  (paid tier)
{ "amountIdr": 250000, "method": "BANK_TRANSFER", "settlementNote": "BCA 1234567890 a.n. Adi Prasetyo" }
```

Validation: `startsAt` must be ≥ now + 1 hour; `videoUrl` `https?://`; `fee.method` ∈ `FREE_CONSULTATION`, `BANK_TRANSFER`, `EWALLET`, `CASH`; `amountIdr` 0–10,000,000 and must be `0` with `FREE_CONSULTATION`.
`200 AlignmentCard`. Errors: `422 VALIDATION_ERROR`, `409 THREAD_CLOSED`.

### `POST /api/bookings/:id/alignment/:itemKey/confirm` — participant
No body. Records the caller's confirmation **for the item's current version**.
`200`

```json
{ "alignment": AlignmentCard, "bookingStatus": "PAID",
  "allItemsConfirmed": false }
```

When every item has confirmations from both parties the booking becomes `SCHEDULED` (with `scheduledAt` from the `schedule` item) and the response is `bookingStatus: "SCHEDULED"`, `allItemsConfirmed: true`. A one-sided confirmation is reported in `AlignmentCard.items[].confirmations` and must be labelled pending in the UI. Errors: `409 ALIGNMENT_INCOMPLETE` is used only when a client tries to force scheduling through an edit; confirmation itself never errors for being partial.

### `POST /api/bookings/:id/complete` — participant
No body. `SCHEDULED → COMPLETED`, sets `completedAt` and `reviewEligibleAt = completedAt + 60 min`.
`200 { "booking": Booking, "reviewEligibleAt": "…" }`. Errors: `409 CONFLICT` when not `SCHEDULED`.

## 13. Reviews, mood check, notifications (US 5.1)

### `GET /api/bookings/:id/review` — `MENTEE` (owner)
`200`

```json
{ "eligible": false, "reviewEligibleAt": "2026-11-20T11:00:00.000Z",
  "reason": "NOT_YET", "submitted": false, "review": null }
```

`reason` ∈ `NOT_COMPLETED`, `NOT_YET`, `ELIGIBLE`, `ALREADY_SUBMITTED`.
`404 NOT_FOUND` for a booking that is not the caller's.

### `POST /api/bookings/:id/review` — `MENTEE` (owner)
```json
{ "academicGuidance": 5, "wellBeingSupport": 4,
  "comment": "Sangat membantu, tapi saya butuh waktu lebih untuk diskusi.",
  "moodCheck": { "stressLevel": 2 } }
```

- Both axes are required, each 1–5, and are stored separately (no blended score).
- `comment` optional, ≤ 1000 chars; profanity/PII filter may withhold publication (`status: WITHHELD`).
- `moodCheck` optional and private; it is never returned by mentor/admin endpoints and never reflected back as a score.

`201 { "review": { "id": "rev_1", "academicGuidance": 5, "wellBeingSupport": 4, "comment": "…", "status": "PUBLISHED", "createdAt": "…" }, "bookingStatus": "REVIEWED", "moodRecorded": true }`
Errors: `409 REVIEW_NOT_ELIGIBLE` (before `reviewEligibleAt` or not completed), `409 REVIEW_ALREADY_SUBMITTED` (G5), `422 VALIDATION_ERROR` (missing axis).

### `GET /api/me/reviews` — `MENTEE`
`200 { "items": [{ "review": ReviewPublic, "bookingId": "…", "mentor": MentorCard }], "page": 1, "pageSize": 12, "total": 1 }`

### `GET /api/notifications` — any role
Mock in-app notifications (OTP, decision, agreement, review prompt). `?unreadOnly=true`
`200 { "items": [{ "id": "ntf_1", "type": "REVIEW_PROMPT", "payload": { "bookingId": "bkg_1" }, "readAt": null, "createdAt": "…" }], "unreadCount": 1 }`

### `POST /api/notifications/:id/read` — any role
`200 { "id": "ntf_1", "readAt": "…" }`. `404 NOT_FOUND`.

## 14. Admin console (US 5.2)

All routes require `ADMIN` (`403 ROLE_FORBIDDEN`). Every decision writes an `audit_events` row with actor, timestamp, reason (`docs/data-model.md` §3.13).

### `GET /api/admin/applications`
`?status=PENDING_REVIEW&tier=EDUCATOR_STANDARD&sort=slaAge|submittedAt&page&pageSize`
`200 { "items": [AdminQueueItem], "page": 1, "pageSize": 12, "total": 2, "counts": { "PENDING_REVIEW": 2, "APPROVED": 8, "REJECTED": 1 } }`

### `GET /api/admin/applications/:id`
`200 AdminQueueItem & { "domainCheck": { "email": "hendra@ugm.ac.id", "domain": "ugm.ac.id", "allowed": true, "institution": "Universitas Gadjah Mada" }, "verifiedLinks": { "sister": null, "scopus": null, "orcid": null, "googleScholar": "https://…", "linkedin": "https://…", "institutional": "https://…" }, "audit": [AuditEvent] }`
Missing/invalid-domain flags are computed server-side; the UI renders them, it does not derive them.

### `POST /api/admin/applications/:id/decision`
```json
{ "decision": "REJECT", "reasonCode": "MISSING_EVIDENCE", "note": "Unggah bukti pengalaman luar negeri." }
```
`200`

```json
{ "applicationId": "app_hendra", "status": "REJECTED", "decidedAt": "…",
  "reasonCode": "MISSING_EVIDENCE", "reasonText": "Bukti kredensial belum lengkap.",
  "mentorListed": false, "badge": null }
```

- `APPROVE` requires the tier checklist to be complete; it sets `mentor.status = APPROVED`, publishes the storefront, and makes the mentor discoverable.
- `REJECT` requires a `reasonCode` (`422 REASON_REQUIRED` otherwise); `note` is optional ≤ 500 chars.
- Concurrency: a decision on an already-decided application returns `409 APPLICATION_ALREADY_DECIDED` (conditional update on status).
`404 NOT_FOUND`.

### `GET /api/admin/reasons`
`?scope=APPLICATION|UPGRADE` → `200 { "items": [{ "code": "MISSING_EVIDENCE", "label": "Bukti kredensial belum lengkap", "text": "…" }] }`

### `GET /api/admin/upgrades`
`?status=PENDING_VERIFICATION` → `200 { "items": [UpgradeAdminItem], "total": 1 }`

```jsonc
UpgradeAdminItem { "id": "upr_1", "mentor": MentorCard, "status": "PENDING_VERIFICATION",
                   "checklist": [/* UpgradeStatus.checklist */],
                   "certificate": { "id": "cert_1", "fileName": "…", "issuer": "LMNS",
                                    "issuedAt": "…", "expiresAt": "…", "fileUrl": "…" },
                   "submittedAt": "…" }
```

### `POST /api/admin/upgrades/:id/decision`
`{ "decision": "APPROVE" | "REJECT", "reasonCode": "VERIFIED" | "CERTIFICATE_INVALID", "note": null }`
`200 { "upgradeRequestId": "upr_1", "status": "APPROVED", "badge": { "type": "LMNS_WELL_BEING_CERTIFIED", "issuedAt": "…" }, "mentorTier": "EDUCATOR_PREMIUM" }`
`APPROVE` verifies the certificate and, if every other precondition already holds, issues the badge automatically; otherwise `409 BADGE_PRECONDITIONS_UNMET` with `details.missing`.

### `GET /api/admin/mentors`
`?q=&tier=&badge=` → `200 { "items": [{ "mentor": MentorCard, "badges": [MentorBadge], "status": "APPROVED" }], "total": 8 }`

```jsonc
MentorBadge { "id": "bdg_1", "type": "LMNS_WELL_BEING_CERTIFIED", "label": "LMNS Well-Being Certified",
              "issuedAt": "…", "issuedBy": "usr_reviewer", "revokedAt": null, "revokeReason": null }
```

### `POST /api/admin/mentors/:id/badge`
`{ "action": "ISSUE" | "REVOKE", "reason": "Sertifikat kedaluwarsa" }`
`200 { "mentor": MentorCard, "badge": MentorBadge, "auditId": "aud_1" }`
`ISSUE` requires every Premium precondition verified (G7) → `409 BADGE_PRECONDITIONS_UNMET`. `REVOKE` requires `reason` (`422 REASON_REQUIRED`) and demotes the tier to the mentor's last verified tier.

### `POST /api/admin/domains/check`
`{ "email": "hendra@ugm.ac.id" }` → `200 { "domain": "ugm.ac.id", "allowed": true, "institution": "Universitas Gadjah Mada" }`

### `GET /api/admin/audit`
`?entityType=APPLICATION&entityId=app_hendra&page&pageSize` → `200 { "items": [AuditEvent], … }`

```jsonc
AuditEvent { "id": "aud_1", "entityType": "APPLICATION", "entityId": "app_hendra",
             "actorId": "usr_reviewer", "action": "REJECT", "reasonCode": "MISSING_EVIDENCE",
             "note": "…", "createdAt": "…" }
```

## 15. Story coverage

| Story | Surface | Endpoints |
|---|---|---|
| [x] US 1.1 | Mentee registration, domain allowlist, OTP, academic profile | `POST /api/auth/register`, `POST /api/auth/register/verify`, `POST /api/auth/otp/resend`, `POST /api/auth/login`, `GET/PATCH /api/me/mentee` |
| [x] US 1.2 | Private pulse, skippable, re-promptable with history | `POST /api/me/pulses`, `GET /api/me/pulses`, `GET /api/me/pulses/latest` |
| [x] US 2.1a | Tier selection and tier-specific identity/evidence | `POST /api/mentor/applications`, `PATCH …/identity`, `POST …/submit`, `POST …/withdraw` |
| [x] US 2.1b | Mandatory well-being self-assessment | `PUT …/self-assessment` (+ submit gate) |
| [x] US 2.1c | Storefront builder and publication | `PUT …/storefront`, `GET/PUT /api/mentor/storefront`, `GET /api/mentor/dashboard` |
| [x] US 2.2 | Training, assessment, certificate, badge issuance | `GET /api/mentor/upgrade`, `GET /api/training/modules`, `POST …/modules/:id/complete`, `POST /api/mentor/upgrade/assessment`, `POST …/certificate`, `POST …/submit`, `POST /api/admin/upgrades/:id/decision` |
| [x] US 3.1 | Search, filters, cards, public profile, reviews | `GET /api/mentors`, `GET /api/mentors/facets`, `GET /api/mentors/:slug`, `GET /api/mentors/:slug/reviews` |
| [x] US 4.1 | Intake note, platform-fee checkout, mediation thread, alignment card | `GET /api/mentors/:slug/booking-options`, `POST /api/bookings`, `POST …/payments`, `POST …/payments/:paymentId/confirm`, `GET …/thread`, `POST …/messages`, `GET …/alignment`, `PUT …/alignment/:itemKey`, `POST …/alignment/:itemKey/confirm`, `POST …/complete` |
| [x] US 4.2 | Premium vs. standard comparison at checkout | `GET /api/mentors/:slug/booking-options` (`comparison`) |
| [x] US 5.1 | Dual-axis review, mood check, dual display, one per booking | `GET/POST /api/bookings/:id/review`, `GET /api/me/reviews`, `GET /api/notifications` |
| [x] US 5.2 | Admin queue, evidence review, decisions, badge management, audit | `GET /api/admin/applications`, `GET …/:id`, `POST …/:id/decision`, `GET /api/admin/reasons`, `GET /api/admin/upgrades`, `POST …/decision`, `GET /api/admin/mentors`, `POST …/badge`, `POST /api/admin/domains/check`, `GET /api/admin/audit` |

Gates G1–G7 (see `docs/architecture.md` §6) are covered by `POST /api/bookings`, `GET /api/mentors*`, `GET/POST /api/bookings/:id/thread|messages`, alignment confirmation, `POST /api/bookings/:id/review`, participant serializers, and badge issuance respectively.
