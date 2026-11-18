import type { Db } from '../db/index.js';
import { AppError } from '../http/errors.js';
import type { AuthUser } from '../http/auth.js';
import { asRecord, isIntInRange, requireString, validationError } from '../lib/validate.js';
import { newId, nowIso, addMinutes } from '../lib/helpers.js';
import {
  completedModuleIds,
  findApprovedApplication,
  findCertificateByUpgrade,
  findLatestCertificate,
  findMentorByUserId,
  findOpenUpgrade,
  findTrainingModule,
  findUpgradeById,
  insertCertificate,
  insertTrainingAttempt,
  insertUpgrade,
  completeModule,
  listEvidence,
  listTrainingAttempts,
  listTrainingModules,
  updateCertificate,
  updateUpgrade,
} from '../repos/mentors.js';
import { serializeMentorCard } from '../serializers.js';
import { currentApplication } from './applications.js';
import { countBookingsForMentor } from '../repos/bookings.js';

const TOTAL_ATTEMPT_LIMIT = 3;
const PASS_SCORE = 70;

export const ASSESSMENT_QUESTIONS = [
  { id: 'q1', correct: 2 },
  { id: 'q2', correct: 0 },
  { id: 'q3', correct: 1 },
  { id: 'q4', correct: 2 },
  { id: 'q5', correct: 1 },
];

function evidenceValues(db: Db, mentorId: string): Record<string, string> {
  const application = findApprovedApplication(db, mentorId);
  if (!application) return {};
  return Object.fromEntries(listEvidence(db, application.id).map((row) => [row.key, row.value]));
}

export function trainingState(
  db: Db,
  mentorId: string,
): {
  total: number;
  completed: number;
  remaining: string[];
} {
  const modules = listTrainingModules(db);
  const completed = completedModuleIds(db, mentorId);
  return {
    total: modules.length,
    completed: modules.filter((module) => completed.has(module.id)).length,
    remaining: modules.filter((module) => !completed.has(module.id)).map((module) => module.id),
  };
}

function lastAttempt(db: Db, mentorId: string): { score: number; passed: boolean } | null {
  const attempt = listTrainingAttempts(db, mentorId)[0];
  return attempt ? { score: attempt.score, passed: attempt.passed === 1 } : null;
}

function attemptsToday(db: Db, mentorId: string): number {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  return listTrainingAttempts(db, mentorId).filter(
    (attempt) => Date.parse(attempt.created_at) >= startOfDay.getTime(),
  ).length;
}

export function upgradeStatus(db: Db, mentorId: string): Record<string, unknown> {
  const mentor = findMentorByUserId(db, mentorId);
  if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Profil mentor tidak ditemukan.');

  if (mentor.tier === 'EDUCATOR_PREMIUM') {
    return {
      currentTier: mentor.tier,
      targetTier: null,
      eligible: true,
      checklist: [],
      assessment: {
        score: lastAttempt(db, mentorId)?.score ?? null,
        passed: lastAttempt(db, mentorId)?.passed ?? false,
        attemptsUsed: listTrainingAttempts(db, mentorId).length,
        attemptsRemaining: 0,
      },
    };
  }

  const training = trainingState(db, mentorId);
  const evidence = evidenceValues(db, mentorId);
  const certificate = findLatestCertificate(db, mentorId);
  const attempt = lastAttempt(db, mentorId);

  const trainingStatus =
    training.completed === 0
      ? 'PENDING'
      : training.completed >= training.total
        ? 'VERIFIED'
        : 'IN_PROGRESS';
  const assessmentStatus =
    attempt === null ? 'PENDING' : attempt.passed ? 'VERIFIED' : 'IN_PROGRESS';
  const certificateStatus =
    certificate === undefined
      ? 'PENDING'
      : certificate.status === 'VERIFIED'
        ? 'VERIFIED'
        : certificate.status === 'REJECTED'
          ? 'REJECTED'
          : 'IN_PROGRESS';

  const checklist = [
    {
      key: 'training',
      label: 'Pelatihan Well-Being LMNS',
      status: trainingStatus,
      detail:
        training.completed === 0
          ? null
          : `${training.completed} dari ${training.total} modul selesai`,
    },
    { key: 'assessment', label: 'Asesmen pemahaman', status: assessmentStatus, detail: null },
    {
      key: 's3',
      label: 'Verifikasi S3',
      status: evidence.s3VerificationUrl ? 'VERIFIED' : 'PENDING',
      detail: null,
    },
    {
      key: 'overseas',
      label: 'Pengalaman luar negeri',
      status: evidence.overseasExperienceUrl ? 'VERIFIED' : 'PENDING',
      detail: null,
    },
    { key: 'certificate', label: 'Sertifikat coaching', status: certificateStatus, detail: null },
  ];

  return {
    currentTier: mentor.tier,
    targetTier: 'EDUCATOR_PREMIUM',
    eligible: checklist.every((item) => item.status === 'VERIFIED'),
    checklist,
    assessment: {
      score: attempt?.score ?? null,
      passed: attempt?.passed ?? false,
      attemptsUsed: listTrainingAttempts(db, mentorId).length,
      attemptsRemaining: Math.max(0, TOTAL_ATTEMPT_LIMIT - attemptsToday(db, mentorId)),
    },
  };
}

export function modules(db: Db, mentorId: string): Record<string, unknown> {
  const completed = completedModuleIds(db, mentorId);
  const rows = listTrainingModules(db);
  return {
    items: rows.map((row) => ({
      id: row.id,
      title: row.title,
      durationMinutes: row.duration_minutes,
      completed: completed.has(row.id),
    })),
    total: rows.length,
  };
}

export function moduleDetail(db: Db, mentorId: string, id: string): Record<string, unknown> {
  const row = findTrainingModule(db, id);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Modul tidak ditemukan.');
  const completed = completedModuleIds(db, mentorId);
  const at = db
    .prepare('SELECT completed_at FROM training_progress WHERE mentor_id = ? AND module_id = ?')
    .get(mentorId, id) as { completed_at: string } | undefined;
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    durationMinutes: row.duration_minutes,
    completed: completed.has(row.id),
    completedAt: at?.completed_at ?? null,
  };
}

export function markModuleComplete(db: Db, mentorId: string, id: string): Record<string, unknown> {
  const row = findTrainingModule(db, id);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Modul tidak ditemukan.');
  const at = nowIso();
  completeModule(db, mentorId, id, at);
  const training = trainingState(db, mentorId);
  const stored = db
    .prepare('SELECT completed_at FROM training_progress WHERE mentor_id = ? AND module_id = ?')
    .get(mentorId, id) as { completed_at: string };
  return {
    moduleId: id,
    completed: true,
    completedAt: stored.completed_at,
    modulesRemaining: training.total - training.completed,
  };
}

export function submitAssessment(db: Db, mentorId: string, body: unknown): Record<string, unknown> {
  const training = trainingState(db, mentorId);
  if (training.remaining.length > 0) {
    throw new AppError(409, 'TRAINING_INCOMPLETE', 'Selesaikan semua modul pelatihan.', {
      remainingModules: training.remaining,
    });
  }
  const input = asRecord(body) ?? {};
  const answers = Array.isArray(input.answers) ? input.answers : [];
  if (answers.length === 0) throw validationError({ answers: 'Jawaban asesmen wajib diisi.' });

  const answerMap = new Map<string, number>();
  for (const raw of answers) {
    const answer = asRecord(raw);
    if (!answer || typeof answer.questionId !== 'string') {
      throw validationError({ answers: 'Format jawaban tidak valid.' });
    }
    if (!isIntInRange(answer.choice, 0, 3)) {
      throw validationError({ answers: 'Pilihan jawaban harus 0 sampai 3.' });
    }
    answerMap.set(answer.questionId, answer.choice as number);
  }

  let correct = 0;
  for (const question of ASSESSMENT_QUESTIONS) {
    if (answerMap.get(question.id) === question.correct) correct += 1;
  }
  const score = Math.round((correct / ASSESSMENT_QUESTIONS.length) * 100);
  const passed = score >= PASS_SCORE;
  const now = nowIso();
  insertTrainingAttempt(db, {
    id: newId('att'),
    mentorId,
    score,
    passed,
    answers,
    createdAt: now,
  });
  return {
    score,
    passed,
    attemptsUsed: listTrainingAttempts(db, mentorId).length,
    attemptsRemaining: Math.max(0, TOTAL_ATTEMPT_LIMIT - attemptsToday(db, mentorId)),
    retakeAvailableAt: passed ? null : addMinutes(now, 10),
  };
}

export function uploadCertificate(
  db: Db,
  mentorId: string,
  body: unknown,
): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const fileName = requireString(fields, input.fileName, 'fileName', { max: 200 });
  if (fileName !== null && !/\.(pdf|jpg|jpeg|png)$/i.test(fileName)) {
    fields.fileName = 'Berkas harus pdf, jpg, atau png.';
  }
  const issuer = requireString(fields, input.issuer, 'issuer', { max: 120 });
  const issuedAt = requireString(fields, input.issuedAt, 'issuedAt');
  const expiresAt = requireString(fields, input.expiresAt, 'expiresAt');
  for (const [key, value] of [
    ['issuedAt', issuedAt],
    ['expiresAt', expiresAt],
  ] as const) {
    if (value !== null && Number.isNaN(Date.parse(value))) fields[key] = 'Tanggal tidak valid.';
  }
  if (
    expiresAt !== null &&
    !Number.isNaN(Date.parse(expiresAt)) &&
    Date.parse(expiresAt) < Date.now()
  ) {
    fields.expiresAt = 'Sertifikat sudah kedaluwarsa.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const mentor = findMentorByUserId(db, mentorId);
  if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Profil mentor tidak ditemukan.');

  let upgrade = findOpenUpgrade(db, mentorId);
  if (!upgrade) {
    const now = nowIso();
    const row = {
      id: newId('upr'),
      mentor_id: mentorId,
      status: 'DRAFT' as const,
      submitted_at: null,
      decided_at: null,
      decided_by: null,
      decision_reason_code: null,
      decision_note: null,
      created_at: now,
    };
    insertUpgrade(db, row);
    upgrade = row;
  }

  const id = newId('cert');
  const uploadedAt = nowIso();
  insertCertificate(db, {
    id,
    upgrade_request_id: upgrade.id,
    file_name: fileName as string,
    issuer: issuer as string,
    file_url: `demo-upload://${fileName as string}`,
    issued_at: issuedAt as string,
    expires_at: expiresAt as string,
    verified_at: null,
    verified_by: null,
    status: 'PENDING_VERIFICATION',
  });
  return {
    id,
    status: 'PENDING_VERIFICATION',
    fileName,
    uploadedAt,
  };
}

export function submitUpgrade(db: Db, mentorId: string): Record<string, unknown> {
  const status = upgradeStatus(db, mentorId);
  const checklist = status.checklist as {
    key: string;
    status: string;
  }[];
  const training = trainingState(db, mentorId);
  if (training.remaining.length > 0) {
    throw new AppError(409, 'TRAINING_INCOMPLETE', 'Selesaikan semua modul pelatihan.', {
      remainingModules: training.remaining,
    });
  }
  const missing = checklist
    .filter((item) => {
      if (item.key === 'training' || item.key === 'assessment') return false;
      // The coaching certificate is verified by an admin during the upgrade
      // decision, so submit only requires that it has been uploaded.
      if (item.key === 'certificate') return item.status === 'PENDING';
      return item.status !== 'VERIFIED';
    })
    .map((item) => item.key);
  if (missing.length > 0) {
    throw new AppError(409, 'BADGE_PRECONDITIONS_UNMET', 'Prasyarat badge belum terpenuhi.', {
      missing,
    });
  }

  let upgrade = findOpenUpgrade(db, mentorId);
  const now = nowIso();
  if (upgrade) {
    updateUpgrade(db, upgrade.id, { status: 'PENDING_VERIFICATION', submitted_at: now });
    upgrade = findUpgradeById(db, upgrade.id) as typeof upgrade;
  } else {
    upgrade = {
      id: newId('upr'),
      mentor_id: mentorId,
      status: 'PENDING_VERIFICATION',
      submitted_at: now,
      decided_at: null,
      decided_by: null,
      decision_reason_code: null,
      decision_note: null,
      created_at: now,
    };
    insertUpgrade(db, upgrade);
    const certificate = findLatestCertificate(db, mentorId);
    if (certificate) {
      updateCertificate(db, certificate.id, { upgrade_request_id: upgrade.id });
    }
  }
  return {
    upgradeRequestId: upgrade.id,
    status: 'PENDING_VERIFICATION',
    checklist: status.checklist,
  };
}

export function certificateForUpgrade(db: Db, upgradeId: string): Record<string, unknown> | null {
  const row = findCertificateByUpgrade(db, upgradeId);
  if (!row) return null;
  return {
    id: row.id,
    fileName: row.file_name,
    issuer: row.issuer,
    issuedAt: row.issued_at,
    expiresAt: row.expires_at,
    fileUrl: row.file_url,
    status: row.status,
  };
}

export function mentorDashboard(db: Db, user: AuthUser): Record<string, unknown> {
  const mentor = findMentorByUserId(db, user.id);
  const application = currentApplication(db, user);
  return {
    application,
    mentor: mentor ? serializeMentorCard(db, mentor) : null,
    upgrade: mentor ? upgradeStatus(db, mentor.user_id) : null,
    stats: {
      upcomingBookings: countBookingsForMentor(db, user.id, ['SCHEDULED']),
      pendingAgreements: countBookingsForMentor(db, user.id, ['PAID']),
      completedSessions: countBookingsForMentor(db, user.id, ['COMPLETED', 'REVIEWED']),
    },
  };
}
