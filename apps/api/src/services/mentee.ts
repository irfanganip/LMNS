import type { Db } from '../db/index.js';
import { AppError } from '../http/errors.js';
import type { AuthUser } from '../http/auth.js';
import { asRecord, isIntInRange, requireString, validationError } from '../lib/validate.js';
import { newId, nowIso, readPagination, toJson } from '../lib/helpers.js';
import {
  findMenteeProfile,
  insertPulse,
  latestPulse,
  listPulses,
  upsertMenteeProfile,
} from '../repos/identity.js';
import { serializeMenteeProfile, serializePulse } from '../serializers.js';
import { GOALS } from './auth.js';

const LEVELS = ['S1', 'S2', 'S3'];

export function getMenteeProfile(db: Db, user: AuthUser): Record<string, unknown> {
  const profile = findMenteeProfile(db, user.id);
  if (!profile) throw new AppError(404, 'NOT_FOUND', 'Profil mentee tidak ditemukan.');
  return serializeMenteeProfile(profile);
}

export function patchMenteeProfile(db: Db, user: AuthUser, body: unknown): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const patch: {
    academicLevel?: string;
    university?: string;
    facultyMajor?: string;
    semester?: number;
    goals?: string[];
  } = {};

  if (input.academicLevel !== undefined) {
    const level = requireString(fields, input.academicLevel, 'academicLevel');
    if (level !== null && !LEVELS.includes(level)) {
      fields.academicLevel = 'Jenjang harus S1, S2, atau S3.';
    } else if (level !== null) patch.academicLevel = level;
  }
  if (input.university !== undefined) {
    const value = requireString(fields, input.university, 'university', { max: 200 });
    if (value !== null) patch.university = value;
  }
  if (input.facultyMajor !== undefined) {
    const value = requireString(fields, input.facultyMajor, 'facultyMajor', { max: 200 });
    if (value !== null) patch.facultyMajor = value;
  }
  if (input.semester !== undefined) {
    if (!isIntInRange(input.semester, 1, 14)) {
      fields.semester = 'Semester harus 1 sampai 14.';
    } else {
      patch.semester = input.semester as number;
    }
  }
  if (input.goals !== undefined) {
    const goals = Array.isArray(input.goals) ? input.goals : [];
    if (goals.some((goal) => typeof goal !== 'string' || !GOALS.includes(goal as never))) {
      fields.goals = 'Tujuan tidak dikenal.';
    } else {
      patch.goals = goals as string[];
    }
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const existing = findMenteeProfile(db, user.id);
  const mergedGoals =
    patch.goals ?? (existing ? (JSON.parse(existing.goals_json) as string[]) : []);
  const mergedLevel = patch.academicLevel ?? existing?.academic_level ?? null;
  const complete = mergedLevel !== null && mergedGoals.length > 0;
  const onboarding = existing?.onboarding_completed_at ?? (complete ? nowIso() : null);

  upsertMenteeProfile(db, user.id, patch, onboarding);
  return getMenteeProfile(db, user);
}

const LIKERT_KEYS = [
  'workloadStress',
  'researchBlocker',
  'timePressure',
  'supportNeed',
  'energyLevel',
];
const TONES = ['GENTLE', 'STRUCTURED'];

export function createPulse(db: Db, user: AuthUser, body: unknown): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const skipped = input.skipped === true;

  if (!skipped) {
    const answers = asRecord(input.answers);
    if (!answers) {
      throw validationError({ answers: 'Isi jawaban atau tandai lewati.' });
    }
    const keys = Object.keys(answers);
    if (keys.length === 0 || keys.length > 5) {
      fields.answers = 'Isi 1 sampai 5 jawaban.';
    }
    for (const key of keys) {
      if (!LIKERT_KEYS.includes(key) && key !== 'preferredTone') {
        fields[key] = 'Pertanyaan tidak dikenal.';
        continue;
      }
      if (key === 'preferredTone') {
        if (!TONES.includes(answers[key] as string)) {
          fields.preferredTone = 'Preferensi harus GENTLE atau STRUCTURED.';
        }
      } else if (!isIntInRange(answers[key], 1, 5)) {
        fields[key] = 'Nilai harus 1 sampai 5.';
      }
    }
    const likertCount = keys.filter((key) => LIKERT_KEYS.includes(key)).length;
    if (likertCount < 1) fields.answers = 'Isi minimal satu jawaban Likert.';
    if (Object.keys(fields).length > 0) throw validationError(fields);
  }

  const row = {
    id: newId('pulse'),
    menteeId: user.id,
    answers: skipped ? {} : (input.answers as Record<string, unknown>),
    skipped,
    createdAt: nowIso(),
  };
  insertPulse(db, row);
  return {
    id: row.id,
    answers: row.answers,
    skipped: row.skipped,
    createdAt: row.createdAt,
  };
}

export function pulses(
  db: Db,
  user: AuthUser,
  query: Record<string, unknown>,
): Record<string, unknown> {
  const { page, pageSize, offset } = readPagination(query);
  const { rows, total } = listPulses(db, user.id, pageSize, offset);
  return { items: rows.map(serializePulse), page, pageSize, total };
}

export function pulseLatest(db: Db, user: AuthUser): Record<string, unknown> | null {
  const row = latestPulse(db, user.id);
  return row ? serializePulse(row) : null;
}

export function pulseAnswersFor(db: Db, userId: string): string {
  const row = latestPulse(db, userId);
  return row ? toJson(JSON.parse(row.answers)) : '{}';
}
