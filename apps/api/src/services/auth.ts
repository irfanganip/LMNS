import { createHash, randomBytes } from 'node:crypto';
import type { Db } from '../db/index.js';
import { config } from '../config.js';
import { AppError } from '../http/errors.js';
import {
  asRecord,
  domainAllowed,
  emailDomain,
  isEmail,
  isIntInRange,
  requireString,
  validationError,
} from '../lib/validate.js';
import { newId, nowIso } from '../lib/helpers.js';
import {
  consumeOtpChallenge,
  countOtpChallengesSince,
  createSession,
  deleteSession,
  findInstitution,
  findMenteeProfile,
  findUserByEmail,
  incrementOtpAttempts,
  insertOtpChallenge,
  insertUser,
  latestOtpChallenge,
  markEmailVerified,
  upsertMenteeProfile,
} from '../repos/identity.js';
import { findMentorByUserId } from '../repos/mentors.js';
import type { AuthUser, Role } from '../http/auth.js';
import { permissionsFor } from '../http/auth.js';
import { serializeMenteeProfile, serializeMentorCard, serializeUser } from '../serializers.js';

export const GOALS = [
  'Thesis Anxiety',
  'Overseas Scholarship Prep',
  'Research Methodology',
  'Burnout Prevention',
  'Publication Support',
  'Career in Academia',
] as const;

const ACADEMIC_LEVELS = ['S1', 'S2', 'S3'] as const;
const OTP_TTL_MINUTES = 15;
const OTP_WINDOW_MINUTES = 15;
const OTP_MAX_PER_WINDOW = 3;

function hashOtp(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

function newSessionToken(): string {
  return `ses_${randomBytes(16).toString('hex')}`;
}

export function buildSessionResponse(
  db: Db,
  token: string,
  userId: string,
): Record<string, unknown> {
  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as {
    id: string;
    email: string;
    role: Role;
    email_verified_at: string | null;
    created_at: string;
  };
  const mentee = findMenteeProfile(db, userId);
  const mentor = findMentorByUserId(db, userId);
  const body: Record<string, unknown> = {
    user: serializeUser(userRow),
    menteeProfile: mentee ? serializeMenteeProfile(mentee) : null,
    mentorProfile: mentor ? serializeMentorCard(db, mentor) : null,
  };
  if (token !== '') body.token = token;
  return body;
}

export function login(db: Db, body: unknown): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const email = requireString(fields, input.email, 'email', { max: 200 });
  if (email !== null && !isEmail(email)) fields.email = 'Format email tidak valid.';
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const user = findUserByEmail(db, email as string);
  if (!user) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Akun demo tidak ditemukan.');
  }
  const token = newSessionToken();
  createSession(db, token, user.id);
  return buildSessionResponse(db, token, user.id);
}

export function logout(db: Db, token: string): void {
  deleteSession(db, token);
}

export function me(db: Db, user: AuthUser): Record<string, unknown> {
  return {
    ...buildSessionResponse(db, '', user.id),
    permissions: permissionsFor(user.role),
  };
}

interface RegisterInput {
  email: string;
  academicLevel: string;
  university: string;
  facultyMajor: string;
  semester: number;
  goals: string[];
}

function readRegisterInput(body: unknown): RegisterInput {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const email = requireString(fields, input.email, 'email', { max: 200 });
  if (email !== null && !isEmail(email)) fields.email = 'Format email tidak valid.';
  const academicLevel = requireString(fields, input.academicLevel, 'academicLevel');
  if (academicLevel !== null && !(ACADEMIC_LEVELS as readonly string[]).includes(academicLevel)) {
    fields.academicLevel = 'Jenjang harus S1, S2, atau S3.';
  }
  const university = requireString(fields, input.university, 'university', { max: 200 });
  const facultyMajor = requireString(fields, input.facultyMajor, 'facultyMajor', { max: 200 });
  const semester = input.semester;
  if (!isIntInRange(semester, 1, 14)) fields.semester = 'Semester harus 1 sampai 14.';
  const goals = Array.isArray(input.goals) ? input.goals : [];
  if (goals.length === 0) {
    fields.goals = 'Pilih minimal satu tujuan.';
  } else if (goals.some((goal) => typeof goal !== 'string' || !GOALS.includes(goal as never))) {
    fields.goals = 'Tujuan tidak dikenal.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);
  return {
    email: email as string,
    academicLevel: academicLevel as string,
    university: university as string,
    facultyMajor: facultyMajor as string,
    semester: semester as number,
    goals: goals as string[],
  };
}

function assertDomainAllowed(email: string): void {
  if (!domainAllowed(email, config.allowedEmailDomains)) {
    throw new AppError(
      422,
      'DOMAIN_NOT_ALLOWED',
      'Gunakan email kampus yang terdaftar (.ac.id atau .edu).',
      { allowedDomains: config.allowedEmailDomains },
    );
  }
}

function issueOtp(db: Db, email: string): { expiresAt: string; challengeId: string } {
  const createdAt = nowIso();
  const expiresAt = new Date(Date.parse(createdAt) + OTP_TTL_MINUTES * 60_000).toISOString();
  const id = newId('otp');
  insertOtpChallenge(db, {
    id,
    email: email.toLowerCase(),
    code_hash: hashOtp(config.demoOtp),
    expires_at: expiresAt,
    consumed_at: null,
    attempts: 0,
    created_at: createdAt,
  });
  return { expiresAt, challengeId: id };
}

export function register(db: Db, body: unknown): Record<string, unknown> {
  const input = readRegisterInput(body);
  assertDomainAllowed(input.email);

  const existing = findUserByEmail(db, input.email);
  if (existing) {
    throw new AppError(409, 'EMAIL_ALREADY_REGISTERED', 'Email ini sudah terdaftar.', {
      suggest: 'SIGN_IN',
    });
  }

  const since = new Date(Date.now() - OTP_WINDOW_MINUTES * 60_000).toISOString();
  if (countOtpChallengesSince(db, input.email, since) >= OTP_MAX_PER_WINDOW) {
    throw new AppError(429, 'OTP_RATE_LIMITED', 'Terlalu banyak permintaan OTP. Coba lagi nanti.', {
      retryAfterSeconds: OTP_WINDOW_MINUTES * 60,
    });
  }

  const userId = newId('usr');
  insertUser(db, {
    id: userId,
    email: input.email.toLowerCase(),
    role: 'MENTEE',
    email_verified_at: null,
    created_at: nowIso(),
  });
  upsertMenteeProfile(
    db,
    userId,
    {
      academicLevel: input.academicLevel,
      university: input.university,
      facultyMajor: input.facultyMajor,
      semester: input.semester,
      goals: input.goals,
    },
    null,
  );
  const challenge = issueOtp(db, input.email);
  return {
    userId,
    email: input.email.toLowerCase(),
    emailVerified: false,
    otp: {
      required: true,
      expiresAt: challenge.expiresAt,
      demoOtp: config.demoOtp,
    },
  };
}

export function verifyRegistration(db: Db, body: unknown): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const email = requireString(fields, input.email, 'email', { max: 200 });
  if (email !== null && !isEmail(email)) fields.email = 'Format email tidak valid.';
  const otp = requireString(fields, input.otp, 'otp', { min: 6, max: 6 });
  if (otp !== null && !/^\d{6}$/.test(otp)) fields.otp = 'OTP harus 6 digit.';
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const user = findUserByEmail(db, email as string);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Akun tidak ditemukan.');
  const challenge = latestOtpChallenge(db, email as string);
  if (!challenge) throw new AppError(404, 'NOT_FOUND', 'Permintaan OTP tidak ditemukan.');
  if (challenge.consumed_at !== null) {
    throw validationError({ otp: 'OTP sudah digunakan. Minta kode baru.' });
  }
  if (Date.parse(challenge.expires_at) < Date.now()) {
    throw new AppError(410, 'OTP_EXPIRED', 'Kode OTP sudah kedaluwarsa.', {
      resendAvailable: true,
    });
  }
  if (hashOtp(otp as string) !== challenge.code_hash) {
    incrementOtpAttempts(db, challenge.id);
    throw validationError({ otp: 'Kode OTP salah.' });
  }

  const now = nowIso();
  consumeOtpChallenge(db, challenge.id, now);
  markEmailVerified(db, user.id, now);

  const mentee = findMenteeProfile(db, user.id);
  const goals = mentee ? (JSON.parse(mentee.goals_json) as unknown[]) : [];
  const profileComplete =
    mentee !== undefined && mentee.academic_level !== null && goals.length > 0;
  if (mentee && profileComplete && mentee.onboarding_completed_at === null) {
    upsertMenteeProfile(db, user.id, {}, now);
  }

  const token = newSessionToken();
  createSession(db, token, user.id);
  return buildSessionResponse(db, token, user.id);
}

export function resendOtp(db: Db, body: unknown): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const email = requireString(fields, input.email, 'email', { max: 200 });
  if (email !== null && !isEmail(email)) fields.email = 'Format email tidak valid.';
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const user = findUserByEmail(db, email as string);
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Akun tidak ditemukan.');

  const since = new Date(Date.now() - OTP_WINDOW_MINUTES * 60_000).toISOString();
  const recent = countOtpChallengesSince(db, email as string, since);
  if (recent >= OTP_MAX_PER_WINDOW) {
    throw new AppError(429, 'OTP_RATE_LIMITED', 'Batas kirim ulang OTP tercapai.', {
      retryAfterSeconds: OTP_WINDOW_MINUTES * 60,
    });
  }
  const challenge = issueOtp(db, email as string);
  return {
    expiresAt: challenge.expiresAt,
    demoOtp: config.demoOtp,
    resendsRemaining: OTP_MAX_PER_WINDOW - recent - 1,
  };
}

export function domainCheck(db: Db, email: string): Record<string, unknown> {
  const domain = emailDomain(email);
  const allowed = domainAllowed(email, config.allowedEmailDomains);
  return {
    email,
    domain,
    allowed,
    institution: findInstitution(db, domain),
  };
}
