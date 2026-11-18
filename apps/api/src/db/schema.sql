-- LMNS prototype — full schema (docs/data-model.md).
--
-- Statements must stay idempotent: `npm run dev` applies this file on boot.
-- The bootstrap slice (identity, domains, sessions, pulses) came from S1; S2
-- adds the application, mentor, booking, mediation, review and admin tables.

CREATE TABLE IF NOT EXISTS seed_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL
);

-- 3.1 Identity and access ---------------------------------------------------

CREATE TABLE IF NOT EXISTS users (
  id               TEXT PRIMARY KEY,
  email            TEXT NOT NULL UNIQUE,
  role             TEXT NOT NULL CHECK (role IN ('MENTEE', 'MENTOR', 'ADMIN')),
  email_verified_at TEXT,
  created_at       TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS institution_domains (
  domain           TEXT PRIMARY KEY,
  institution_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_challenges (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL,
  code_hash   TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  consumed_at TEXT,
  attempts    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_challenges (email, created_at DESC);

-- 3.2 Mentee ----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mentee_profiles (
  user_id                TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  academic_level         TEXT CHECK (academic_level IN ('S1', 'S2', 'S3')),
  university             TEXT,
  faculty_major          TEXT,
  semester               INTEGER CHECK (semester BETWEEN 1 AND 14),
  goals_json             TEXT NOT NULL DEFAULT '[]',
  onboarding_completed_at TEXT
);

-- Well-being pulse answers are private to the mentee (G6).
CREATE TABLE IF NOT EXISTS well_being_pulses (
  id         TEXT PRIMARY KEY,
  mentee_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  answers    TEXT NOT NULL,
  skipped    INTEGER NOT NULL DEFAULT 0 CHECK (skipped IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pulses_mentee ON well_being_pulses (mentee_id, created_at);

-- 3.3 Mentor application ----------------------------------------------------

CREATE TABLE IF NOT EXISTS mentor_applications (
  id                 TEXT PRIMARY KEY,
  mentor_id          TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  tier               TEXT NOT NULL CHECK (tier IN ('BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM')),
  status             TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN')),
  current_step       TEXT NOT NULL DEFAULT 'IDENTITY'
                     CHECK (current_step IN ('IDENTITY', 'SELF_ASSESSMENT', 'STORE_FRONT', 'REVIEW')),
  display_name       TEXT,
  academic_title     TEXT,
  institution        TEXT,
  discipline         TEXT,
  submitted_at       TEXT,
  sla_due_at         TEXT,
  decided_at         TEXT,
  decision_reason_code TEXT,
  decision_note      TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON mentor_applications (status, submitted_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_open
  ON mentor_applications (mentor_id) WHERE status IN ('DRAFT', 'PENDING_REVIEW');

CREATE TABLE IF NOT EXISTS application_evidence (
  application_id TEXT NOT NULL REFERENCES mentor_applications (id) ON DELETE CASCADE,
  key            TEXT NOT NULL,
  mentor_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  value          TEXT NOT NULL,
  verified_at    TEXT,
  verified_by    TEXT REFERENCES users (id),
  PRIMARY KEY (application_id, key)
);

CREATE TABLE IF NOT EXISTS mentor_self_assessments (
  application_id   TEXT PRIMARY KEY REFERENCES mentor_applications (id) ON DELETE CASCADE,
  philosophy       TEXT NOT NULL,
  boundaries       TEXT NOT NULL,
  burnout_approach TEXT NOT NULL,
  completed_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mentor_storefronts (
  id                    TEXT PRIMARY KEY,
  application_id        TEXT REFERENCES mentor_applications (id) ON DELETE CASCADE,
  mentor_id             TEXT REFERENCES users (id) ON DELETE CASCADE,
  niche                 TEXT,
  intro                 TEXT,
  well_being_philosophy TEXT,
  intro_video_url       TEXT,
  strengths_json        TEXT NOT NULL DEFAULT '[]',
  languages_json        TEXT NOT NULL DEFAULT '[]',
  formats_json          TEXT NOT NULL DEFAULT '[]',
  overseas_destinations_json TEXT NOT NULL DEFAULT '[]',
  published             INTEGER NOT NULL DEFAULT 0 CHECK (published IN (0, 1)),
  updated_at            TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_storefronts_mentor ON mentor_storefronts (mentor_id);
CREATE INDEX IF NOT EXISTS idx_storefronts_application ON mentor_storefronts (application_id);

CREATE TABLE IF NOT EXISTS storefront_packages (
  id                  TEXT PRIMARY KEY,
  storefront_id       TEXT NOT NULL REFERENCES mentor_storefronts (id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  duration_minutes    INTEGER NOT NULL CHECK (duration_minutes BETWEEN 30 AND 180),
  price_idr           INTEGER NOT NULL CHECK (price_idr BETWEEN 0 AND 5000000),
  is_free_consultation INTEGER NOT NULL DEFAULT 0 CHECK (is_free_consultation IN (0, 1)),
  position            INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS application_events (
  id             TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES mentor_applications (id) ON DELETE CASCADE,
  status         TEXT NOT NULL,
  actor_id       TEXT NOT NULL REFERENCES users (id),
  note           TEXT,
  created_at     TEXT NOT NULL
);

-- 3.4 Verified mentors, badges, upgrades ------------------------------------

CREATE TABLE IF NOT EXISTS mentor_profiles (
  user_id           TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  slug              TEXT NOT NULL UNIQUE,
  display_name      TEXT NOT NULL,
  academic_title    TEXT,
  institution       TEXT,
  discipline        TEXT,
  tier              TEXT NOT NULL CHECK (tier IN ('BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM')),
  status            TEXT NOT NULL CHECK (status IN ('PENDING_REVIEW', 'APPROVED', 'REJECTED')),
  listed_at         TEXT,
  session_fee_idr   INTEGER NOT NULL DEFAULT 0,
  languages         TEXT NOT NULL DEFAULT '[]',
  formats           TEXT NOT NULL DEFAULT '[]',
  research_focus_json TEXT NOT NULL DEFAULT '[]',
  overseas_destinations_json TEXT NOT NULL DEFAULT '[]',
  degree_focus_json TEXT NOT NULL DEFAULT '[]',
  verified_links_json TEXT NOT NULL DEFAULT '{}',
  source_application_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentor_profiles (status, tier);

CREATE TABLE IF NOT EXISTS mentor_badges (
  id            TEXT PRIMARY KEY,
  mentor_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('SISTER_VERIFIED', 'SCOPUS_ORCID_VERIFIED', 'LMNS_WELL_BEING_CERTIFIED')),
  issued_at     TEXT NOT NULL,
  issued_by     TEXT NOT NULL REFERENCES users (id),
  revoked_at    TEXT,
  revoke_reason TEXT,
  status        TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED'))
);

CREATE TABLE IF NOT EXISTS mentor_badge_events (
  id         TEXT PRIMARY KEY,
  badge_id   TEXT NOT NULL REFERENCES mentor_badges (id) ON DELETE CASCADE,
  action     TEXT NOT NULL CHECK (action IN ('ISSUE', 'REVOKE')),
  actor_id   TEXT NOT NULL REFERENCES users (id),
  reason     TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS premium_upgrade_requests (
  id                   TEXT PRIMARY KEY,
  mentor_id            TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status               TEXT NOT NULL CHECK (status IN ('DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REJECTED')),
  submitted_at         TEXT,
  decided_at           TEXT,
  decided_by           TEXT REFERENCES users (id),
  decision_reason_code TEXT,
  decision_note        TEXT,
  created_at           TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mentor_certificates (
  id                 TEXT PRIMARY KEY,
  upgrade_request_id TEXT NOT NULL REFERENCES premium_upgrade_requests (id) ON DELETE CASCADE,
  file_name          TEXT NOT NULL,
  issuer             TEXT NOT NULL,
  file_url           TEXT NOT NULL,
  issued_at          TEXT NOT NULL,
  expires_at         TEXT NOT NULL,
  verified_at        TEXT,
  verified_by        TEXT REFERENCES users (id),
  status             TEXT NOT NULL DEFAULT 'PENDING_VERIFICATION'
                     CHECK (status IN ('PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS training_modules (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  content          TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  position         INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS training_progress (
  mentor_id    TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  module_id    TEXT NOT NULL REFERENCES training_modules (id),
  completed_at TEXT NOT NULL,
  PRIMARY KEY (mentor_id, module_id)
);

CREATE TABLE IF NOT EXISTS training_attempts (
  id            TEXT PRIMARY KEY,
  mentor_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  module_batch  TEXT NOT NULL,
  score         INTEGER NOT NULL,
  passed        INTEGER NOT NULL CHECK (passed IN (0, 1)),
  answers_json  TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

-- 3.5 Booking and payment ---------------------------------------------------

CREATE TABLE IF NOT EXISTS bookings (
  id               TEXT PRIMARY KEY,
  mentee_id        TEXT NOT NULL REFERENCES users (id),
  mentor_id        TEXT NOT NULL REFERENCES users (id),
  package_id       TEXT,
  tier_snapshot    TEXT NOT NULL CHECK (tier_snapshot IN ('BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM')),
  session_fee_basis TEXT NOT NULL CHECK (session_fee_basis IN ('RP_0', 'AGREED_IN_MEDIATION', 'PACKAGE_PRICE')),
  status           TEXT NOT NULL CHECK (status IN ('AWAITING_PAYMENT', 'PAYMENT_FAILED', 'PAID', 'SCHEDULED', 'COMPLETED', 'REVIEWED', 'CANCELLED')),
  platform_fee_idr INTEGER NOT NULL,
  intake_topic     TEXT NOT NULL,
  intake_bottleneck TEXT NOT NULL,
  intake_stress_level INTEGER CHECK (intake_stress_level BETWEEN 1 AND 5),
  created_at       TEXT NOT NULL,
  paid_at          TEXT,
  scheduled_at     TEXT,
  completed_at     TEXT,
  cancelled_at     TEXT,
  cancel_reason    TEXT,
  review_eligible_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bookings_mentee ON bookings (mentee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_mentor ON bookings (mentor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

CREATE TABLE IF NOT EXISTS payments (
  id              TEXT PRIMARY KEY,
  booking_id      TEXT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  provider        TEXT NOT NULL CHECK (provider IN ('QRIS', 'VIRTUAL_ACCOUNT', 'EWALLET')),
  ewallet         TEXT CHECK (ewallet IN ('GOPAY', 'OVO', 'DANA')),
  amount_idr      INTEGER NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('PENDING', 'SUCCEEDED', 'FAILED', 'EXPIRED')),
  failure_code    TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  instructions_json TEXT NOT NULL DEFAULT '{}',
  receipt_number  TEXT UNIQUE,
  test_outcome    TEXT NOT NULL DEFAULT 'SUCCESS' CHECK (test_outcome IN ('SUCCESS', 'FAILURE')),
  created_at      TEXT NOT NULL,
  expires_at      TEXT NOT NULL,
  paid_at         TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payments (booking_id, created_at DESC);

-- 3.6 Mediation and alignment ----------------------------------------------

CREATE TABLE IF NOT EXISTS mediation_threads (
  id         TEXT PRIMARY KEY,
  booking_id TEXT NOT NULL UNIQUE REFERENCES bookings (id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
  opened_at  TEXT NOT NULL,
  closed_at  TEXT
);

CREATE TABLE IF NOT EXISTS mediation_messages (
  id         TEXT PRIMARY KEY,
  thread_id  TEXT NOT NULL REFERENCES mediation_threads (id) ON DELETE CASCADE,
  sender_id  TEXT NOT NULL REFERENCES users (id),
  sender_role TEXT NOT NULL CHECK (sender_role IN ('MENTEE', 'MENTOR', 'ADMIN')),
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_thread ON mediation_messages (thread_id, created_at);

CREATE TABLE IF NOT EXISTS alignment_items (
  id            TEXT PRIMARY KEY,
  booking_id    TEXT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  key           TEXT NOT NULL CHECK (key IN ('scope', 'schedule', 'fee')),
  value_json    TEXT,
  version       INTEGER NOT NULL DEFAULT 0,
  proposed_by   TEXT REFERENCES users (id),
  proposed_at   TEXT,
  confirmed     INTEGER NOT NULL DEFAULT 0 CHECK (confirmed IN (0, 1)),
  UNIQUE (booking_id, key)
);

CREATE TABLE IF NOT EXISTS alignment_item_confirmations (
  item_id      TEXT NOT NULL REFERENCES alignment_items (id) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users (id),
  item_version INTEGER NOT NULL,
  confirmed_at TEXT NOT NULL,
  PRIMARY KEY (item_id, user_id, item_version)
);

-- 3.7 Reviews and mood ------------------------------------------------------

CREATE TABLE IF NOT EXISTS reviews (
  id                TEXT PRIMARY KEY,
  booking_id        TEXT NOT NULL UNIQUE REFERENCES bookings (id),
  mentee_id         TEXT NOT NULL REFERENCES users (id),
  mentor_id         TEXT NOT NULL REFERENCES users (id),
  academic_guidance INTEGER NOT NULL CHECK (academic_guidance BETWEEN 1 AND 5),
  well_being_support INTEGER NOT NULL CHECK (well_being_support BETWEEN 1 AND 5),
  comment           TEXT,
  status            TEXT NOT NULL CHECK (status IN ('PUBLISHED', 'WITHHELD')),
  created_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS mood_checks (
  id           TEXT PRIMARY KEY,
  review_id    TEXT UNIQUE REFERENCES reviews (id) ON DELETE CASCADE,
  booking_id   TEXT NOT NULL REFERENCES bookings (id) ON DELETE CASCADE,
  mentee_id    TEXT NOT NULL REFERENCES users (id),
  stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 5),
  created_at   TEXT NOT NULL
);

-- 3.8 Operations and notifications -----------------------------------------

CREATE TABLE IF NOT EXISTS templated_reasons (
  code  TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('APPLICATION', 'UPGRADE', 'BADGE')),
  label TEXT NOT NULL,
  text  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_events (
  id          TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('APPLICATION', 'UPGRADE', 'BADGE', 'BOOKING')),
  entity_id   TEXT NOT NULL,
  actor_id    TEXT NOT NULL REFERENCES users (id),
  action      TEXT NOT NULL,
  reason_code TEXT,
  note        TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_events (entity_type, entity_id, created_at);

CREATE TABLE IF NOT EXISTS notifications (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('OTP', 'APPLICATION_DECISION', 'BOOKING_PAID', 'ALIGNMENT_CONFIRMED', 'AGREEMENT_READY', 'REVIEW_PROMPT', 'BADGE_ISSUED')),
  payload_json TEXT NOT NULL DEFAULT '{}',
  read_at      TEXT,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications (user_id, created_at DESC);
