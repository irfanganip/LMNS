-- LMNS prototype — bootstrap schema.
--
-- This is the identity slice of docs/data-model.md. Everything else in that
-- document (applications, bookings, mediation, reviews, admin) is delivered by
-- the backend task (S2) as additional migrations against this same file.
-- Statements must stay idempotent: `npm run dev` applies this file on boot.

CREATE TABLE IF NOT EXISTS seed_meta (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS mentee_profiles (
  user_id                TEXT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  academic_level         TEXT CHECK (academic_level IN ('S1', 'S2', 'S3')),
  university             TEXT,
  faculty_major          TEXT,
  semester               INTEGER,
  goals_json             TEXT NOT NULL DEFAULT '[]',
  onboarding_completed_at TEXT
);

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
  formats           TEXT NOT NULL DEFAULT '[]'
);

-- Well-being pulse answers are private to the mentee (D-rule, BR-03).
CREATE TABLE IF NOT EXISTS well_being_pulses (
  id         TEXT PRIMARY KEY,
  mentee_id  TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  answers    TEXT NOT NULL,
  skipped    INTEGER NOT NULL DEFAULT 0 CHECK (skipped IN (0, 1)),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pulses_mentee ON well_being_pulses (mentee_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentor_profiles (status, tier);
