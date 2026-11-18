import type { Db } from '../db/index.js';
import { nowIso, parseJson } from '../lib/helpers.js';
import type { Role } from '../http/auth.js';

export interface UserRow {
  id: string;
  email: string;
  role: Role;
  email_verified_at: string | null;
  created_at: string;
}

export interface MenteeProfileRow {
  user_id: string;
  academic_level: string | null;
  university: string | null;
  faculty_major: string | null;
  semester: number | null;
  goals_json: string;
  onboarding_completed_at: string | null;
}

export interface PulseRow {
  id: string;
  mentee_id: string;
  answers: string;
  skipped: number;
  created_at: string;
}

export interface OtpRow {
  id: string;
  email: string;
  code_hash: string;
  expires_at: string;
  consumed_at: string | null;
  attempts: number;
  created_at: string;
}

export function findUserByEmail(db: Db, email: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase()) as
    UserRow | undefined;
}

export function findUserById(db: Db, id: string): UserRow | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
}

export function insertUser(db: Db, user: UserRow): void {
  db.prepare(
    'INSERT INTO users (id, email, role, email_verified_at, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(user.id, user.email, user.role, user.email_verified_at, user.created_at);
}

export function markEmailVerified(db: Db, userId: string, at: string): void {
  db.prepare('UPDATE users SET email_verified_at = ? WHERE id = ?').run(at, userId);
}

export function createSession(db: Db, token: string, userId: string): void {
  db.prepare('INSERT INTO sessions (token, user_id, created_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    nowIso(),
  );
}

export function deleteSession(db: Db, token: string): void {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

export function findMenteeProfile(db: Db, userId: string): MenteeProfileRow | undefined {
  return db.prepare('SELECT * FROM mentee_profiles WHERE user_id = ?').get(userId) as
    MenteeProfileRow | undefined;
}

export interface MenteeProfileInput {
  academicLevel?: string;
  university?: string | null;
  facultyMajor?: string | null;
  semester?: number | null;
  goals?: string[];
}

export function upsertMenteeProfile(
  db: Db,
  userId: string,
  input: MenteeProfileInput,
  onboardingCompletedAt: string | null,
): void {
  const existing = findMenteeProfile(db, userId);
  const merged = {
    academicLevel: input.academicLevel ?? existing?.academic_level ?? null,
    university: input.university ?? existing?.university ?? null,
    facultyMajor: input.facultyMajor ?? existing?.faculty_major ?? null,
    semester: input.semester ?? existing?.semester ?? null,
    goals: input.goals ?? parseJson<string[]>(existing?.goals_json, []),
    onboarding: onboardingCompletedAt ?? existing?.onboarding_completed_at ?? null,
  };
  db.prepare(
    `INSERT INTO mentee_profiles
       (user_id, academic_level, university, faculty_major, semester, goals_json, onboarding_completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT (user_id) DO UPDATE SET
       academic_level = excluded.academic_level,
       university = excluded.university,
       faculty_major = excluded.faculty_major,
       semester = excluded.semester,
       goals_json = excluded.goals_json,
       onboarding_completed_at = excluded.onboarding_completed_at`,
  ).run(
    userId,
    merged.academicLevel,
    merged.university,
    merged.facultyMajor,
    merged.semester,
    JSON.stringify(merged.goals),
    merged.onboarding,
  );
}

export function insertPulse(
  db: Db,
  pulse: {
    id: string;
    menteeId: string;
    answers: Record<string, unknown>;
    skipped: boolean;
    createdAt: string;
  },
): void {
  db.prepare(
    'INSERT INTO well_being_pulses (id, mentee_id, answers, skipped, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(
    pulse.id,
    pulse.menteeId,
    JSON.stringify(pulse.answers),
    pulse.skipped ? 1 : 0,
    pulse.createdAt,
  );
}

export function listPulses(
  db: Db,
  menteeId: string,
  limit: number,
  offset: number,
): { rows: PulseRow[]; total: number } {
  const rows = db
    .prepare(
      'SELECT * FROM well_being_pulses WHERE mentee_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
    )
    .all(menteeId, limit, offset) as unknown as PulseRow[];
  const total = (
    db
      .prepare('SELECT COUNT(*) AS count FROM well_being_pulses WHERE mentee_id = ?')
      .get(menteeId) as {
      count: number;
    }
  ).count;
  return { rows, total };
}

export function latestPulse(db: Db, menteeId: string): PulseRow | undefined {
  return db
    .prepare(
      'SELECT * FROM well_being_pulses WHERE mentee_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
    )
    .get(menteeId) as PulseRow | undefined;
}

export function countOtpChallengesSince(db: Db, email: string, since: string): number {
  return (
    db
      .prepare('SELECT COUNT(*) AS count FROM otp_challenges WHERE email = ? AND created_at >= ?')
      .get(email.toLowerCase(), since) as { count: number }
  ).count;
}

export function insertOtpChallenge(db: Db, row: OtpRow): void {
  db.prepare(
    'INSERT INTO otp_challenges (id, email, code_hash, expires_at, consumed_at, attempts, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    row.id,
    row.email,
    row.code_hash,
    row.expires_at,
    row.consumed_at,
    row.attempts,
    row.created_at,
  );
}

export function latestOtpChallenge(db: Db, email: string): OtpRow | undefined {
  return db
    .prepare(
      'SELECT * FROM otp_challenges WHERE email = ? ORDER BY created_at DESC, id DESC LIMIT 1',
    )
    .get(email.toLowerCase()) as OtpRow | undefined;
}

export function consumeOtpChallenge(db: Db, id: string, at: string): void {
  db.prepare('UPDATE otp_challenges SET consumed_at = ? WHERE id = ?').run(at, id);
}

export function incrementOtpAttempts(db: Db, id: string): void {
  db.prepare('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?').run(id);
}

export function findInstitution(db: Db, domain: string): string | null {
  const row = db
    .prepare('SELECT institution_name FROM institution_domains WHERE domain = ?')
    .get(domain) as { institution_name: string } | undefined;
  return row?.institution_name ?? null;
}
