import type { Db } from '../db/index.js';
import { AppError } from '../http/errors.js';
import type { AuthUser } from '../http/auth.js';
import { asRecord, isEmail, requireString, validationError } from '../lib/validate.js';
import { newId, nowIso, readPagination } from '../lib/helpers.js';
import {
  findApplicationById,
  findApprovedApplication,
  findActiveBadge,
  findCertificateByUpgrade,
  findLatestCertificate,
  findMentorByUserId,
  findStorefrontByApplication,
  findUpgradeById,
  insertApplicationEvent,
  insertBadge,
  insertBadgeEvent,
  listApplications,
  countApplicationsByStatus,
  listBadges,
  listEvidence,
  listMentorsByStatus,
  listUpgrades,
  updateBadge,
  updateCertificate,
  updateMentor,
  updateStorefront,
  updateUpgrade,
  type ApplicationRow,
  type BadgeRow,
} from '../repos/mentors.js';
import {
  findReason,
  insertAudit,
  insertNotification,
  listAudit,
  listNotifications,
  listReasons,
  markNotificationRead,
  findNotification,
  unreadCount,
} from '../repos/admin.js';
import { findUserById } from '../repos/identity.js';
import {
  serializeAudit,
  serializeBadge,
  serializeMentorCard,
  serializeNotification,
} from '../serializers.js';
import { applicationView, missingEvidence, missingItemsFor } from './applications.js';
import { upgradeStatus, certificateForUpgrade } from './upgrade.js';
import { domainCheck } from './auth.js';

const FLAG_BY_EVIDENCE: Record<string, string> = {
  degreeUrl: 'MISSING_DEGREE',
  overseasExperienceUrl: 'MISSING_OVERSEAS_EXPERIENCE',
  organisationUrl: 'MISSING_ORGANISATION_PROFILE',
  googleScholarUrl: 'MISSING_GOOGLE_SCHOLAR',
  linkedinUrl: 'MISSING_LINKEDIN',
  s3VerificationUrl: 'MISSING_S3_VERIFICATION',
  sisterId: 'MISSING_SISTER_ID',
  institutionalEmailVerified: 'INSTITUTIONAL_EMAIL_UNVERIFIED',
  scopusId: 'MISSING_SCOPUS_ID',
  certificateUrl: 'MISSING_CERTIFICATE',
};

function flagsFor(db: Db, application: ApplicationRow): string[] {
  const flags: string[] = [];
  for (const key of missingEvidence(db, application)) {
    const flag = FLAG_BY_EVIDENCE[key];
    if (flag) flags.push(flag);
  }
  const user = findUserById(db, application.mentor_id);
  if (user) {
    const check = domainCheck(db, user.email);
    if (!check.allowed) flags.push('DOMAIN_NOT_ALLOWED');
  }
  return flags;
}

function queueItem(db: Db, application: ApplicationRow): Record<string, unknown> {
  const user = findUserById(db, application.mentor_id);
  const reference = application.submitted_at ?? application.created_at;
  const ageHours = Math.max(0, Math.floor((Date.now() - Date.parse(reference)) / 3_600_000));
  return {
    application: applicationView(db, application),
    mentorEmail: user?.email ?? '',
    slaAgeHours: ageHours,
    flags: flagsFor(db, application),
  };
}

export function adminApplications(db: Db, query: Record<string, unknown>): Record<string, unknown> {
  const { page, pageSize, offset } = readPagination(query);
  const status = typeof query.status === 'string' && query.status !== '' ? query.status : undefined;
  const tier = typeof query.tier === 'string' && query.tier !== '' ? query.tier : undefined;
  const sort = query.sort === 'submittedAt' ? 'submittedAt' : 'slaAge';
  const { rows, total } = listApplications(db, { status, tier, sort, limit: pageSize, offset });
  return {
    items: rows.map((row) => queueItem(db, row)),
    page,
    pageSize,
    total,
    counts: countApplicationsByStatus(db),
  };
}

export function adminApplication(db: Db, id: string): Record<string, unknown> {
  const application = findApplicationById(db, id);
  if (!application) throw new AppError(404, 'NOT_FOUND', 'Aplikasi tidak ditemukan.');
  const user = findUserById(db, application.mentor_id);
  const email = user?.email ?? '';
  const check = domainCheck(db, email);
  const evidence = Object.fromEntries(
    listEvidence(db, application.id).map((row) => [row.key, row.value]),
  );
  const audit = listAudit(db, {
    entityType: 'APPLICATION',
    entityId: application.id,
    limit: 50,
    offset: 0,
  }).rows.map(serializeAudit);
  return {
    ...queueItem(db, application),
    domainCheck: { email, ...check },
    verifiedLinks: {
      sister: evidence.sisterId ?? null,
      scopus: evidence.scopusId ?? null,
      orcid: evidence.orcidId ?? null,
      googleScholar: evidence.googleScholarUrl ?? null,
      linkedin: evidence.linkedinUrl ?? null,
      institutional: evidence.s3VerificationUrl ?? evidence.organisationUrl ?? null,
    },
    audit,
  };
}

function reasonText(db: Db, code: string, scope: 'APPLICATION' | 'UPGRADE'): string {
  const reason = findReason(db, code, scope) ?? findReason(db, code);
  if (!reason)
    throw new AppError(422, 'VALIDATION_ERROR', 'Kode alasan tidak dikenal.', {
      fields: { reasonCode: 'Kode alasan tidak dikenal.' },
    });
  return reason.text;
}

function notifyMentor(db: Db, mentorId: string, type: string, payload: unknown): void {
  insertNotification(db, {
    id: newId('ntf'),
    user_id: mentorId,
    type,
    payload_json: JSON.stringify(payload),
    read_at: null,
    created_at: nowIso(),
  });
}

export function decideApplication(
  db: Db,
  id: string,
  actor: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const application = findApplicationById(db, id);
  if (!application) throw new AppError(404, 'NOT_FOUND', 'Aplikasi tidak ditemukan.');
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const decision = requireString(fields, input.decision, 'decision');
  const note = input.note === null || input.note === undefined ? null : input.note;
  if (typeof note === 'string' && note.length > 500) fields.note = 'Catatan maksimal 500 karakter.';
  if (Object.keys(fields).length > 0) throw validationError(fields);
  if (decision !== 'APPROVE' && decision !== 'REJECT') {
    throw validationError({ decision: 'Keputusan harus APPROVE atau REJECT.' });
  }

  if (decision === 'REJECT' && (input.reasonCode === null || input.reasonCode === undefined)) {
    throw new AppError(422, 'REASON_REQUIRED', 'Alasan penolakan wajib dipilih.');
  }
  const reasonCode =
    typeof input.reasonCode === 'string' && input.reasonCode !== '' ? input.reasonCode : null;
  const reason =
    decision === 'REJECT' && reasonCode ? reasonText(db, reasonCode, 'APPLICATION') : null;

  if (decision === 'APPROVE') {
    const missing = missingItemsFor(db, application).map((item) => item.key);
    if (missing.length > 0) {
      throw new AppError(409, 'BADGE_PRECONDITIONS_UNMET', 'Checklist verifikasi belum lengkap.', {
        missing,
      });
    }
  }

  const now = nowIso();
  const updated = db
    .prepare(
      `UPDATE mentor_applications
          SET status = ?, decided_at = ?, decision_reason_code = ?, decision_note = ?, updated_at = ?
        WHERE id = ? AND status = 'PENDING_REVIEW'`,
    )
    .run(
      decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
      now,
      reasonCode,
      typeof note === 'string' ? note : null,
      now,
      application.id,
    );
  if (updated.changes === 0) {
    throw new AppError(409, 'APPLICATION_ALREADY_DECIDED', 'Aplikasi sudah diputuskan.', {
      status: (findApplicationById(db, application.id) as ApplicationRow).status,
    });
  }
  insertApplicationEvent(db, {
    id: newId('evo'),
    application_id: application.id,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    actor_id: actor.id,
    note: typeof note === 'string' ? note : (reason ?? 'Keputusan admin.'),
    created_at: now,
  });
  insertAudit(db, {
    id: newId('aud'),
    entity_type: 'APPLICATION',
    entity_id: application.id,
    actor_id: actor.id,
    action: decision,
    reason_code: reasonCode,
    note: typeof note === 'string' ? note : null,
    created_at: now,
  });

  let badge: Record<string, unknown> | null = null;
  let mentorListed = false;

  if (decision === 'APPROVE') {
    const mentor = findMentorByUserId(db, application.mentor_id);
    if (mentor) {
      updateMentor(db, application.mentor_id, { status: 'APPROVED', listed_at: now });
      const storefront = findStorefrontByApplication(db, application.id);
      if (storefront) {
        updateStorefront(db, storefront.id, { mentor_id: application.mentor_id, published: 1 });
      }
      mentorListed = true;
      badge = issueTierBadge(
        db,
        application.mentor_id,
        actor.id,
        now,
        badgeTypeForTier(application.tier),
      );
    }
    notifyMentor(db, application.mentor_id, 'APPLICATION_DECISION', {
      applicationId: application.id,
      status: 'APPROVED',
    });
  } else {
    updateMentor(db, application.mentor_id, { status: 'REJECTED', listed_at: null });
    notifyMentor(db, application.mentor_id, 'APPLICATION_DECISION', {
      applicationId: application.id,
      status: 'REJECTED',
      reasonCode,
    });
  }

  return {
    applicationId: application.id,
    status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
    decidedAt: now,
    reasonCode,
    reasonText: reason,
    mentorListed,
    badge,
  };
}

function badgeTypeForTier(tier: string): string | null {
  if (tier === 'EDUCATOR_STANDARD') return 'SISTER_VERIFIED';
  if (tier === 'EDUCATOR_PREMIUM') return 'SCOPUS_ORCID_VERIFIED';
  return null;
}

function issueTierBadge(
  db: Db,
  mentorId: string,
  actorId: string,
  at: string,
  type: string | null,
): Record<string, unknown> | null {
  if (!type) return null;
  const existing = findActiveBadge(db, mentorId, type);
  if (existing) return serializeBadge(existing);
  const badge = {
    id: newId('bdg'),
    mentor_id: mentorId,
    type,
    issued_at: at,
    issued_by: actorId,
    revoked_at: null,
    revoke_reason: null,
    status: 'ACTIVE' as const,
  };
  insertBadge(db, badge);
  insertBadgeEvent(db, {
    id: newId('bev'),
    badgeId: badge.id,
    action: 'ISSUE',
    actorId,
    reason: null,
    createdAt: at,
  });
  return serializeBadge(badge as BadgeRow);
}

export function adminReasons(db: Db, query: Record<string, unknown>): Record<string, unknown> {
  const scope = typeof query.scope === 'string' && query.scope !== '' ? query.scope : undefined;
  return {
    items: listReasons(db, scope).map((reason) => ({
      code: reason.code,
      label: reason.label,
      text: reason.text,
    })),
  };
}

function upgradeItem(db: Db, upgradeId: string): Record<string, unknown> {
  const upgrade = findUpgradeById(db, upgradeId);
  if (!upgrade) throw new AppError(404, 'NOT_FOUND', 'Permintaan upgrade tidak ditemukan.');
  const mentor = findMentorByUserId(db, upgrade.mentor_id);
  return {
    id: upgrade.id,
    mentor: mentor ? serializeMentorCard(db, mentor) : null,
    status: upgrade.status,
    checklist: upgradeStatus(db, upgrade.mentor_id).checklist,
    certificate: certificateForUpgrade(db, upgrade.id),
    submittedAt: upgrade.submitted_at,
  };
}

export function adminUpgrades(db: Db, query: Record<string, unknown>): Record<string, unknown> {
  const status = typeof query.status === 'string' && query.status !== '' ? query.status : undefined;
  const rows = listUpgrades(db, status);
  return {
    items: rows.map((row) => upgradeItem(db, row.id)),
    total: rows.length,
  };
}

export function decideUpgrade(
  db: Db,
  id: string,
  actor: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const upgrade = findUpgradeById(db, id);
  if (!upgrade) throw new AppError(404, 'NOT_FOUND', 'Permintaan upgrade tidak ditemukan.');
  if (upgrade.status !== 'PENDING_VERIFICATION') {
    throw new AppError(409, 'APPLICATION_ALREADY_DECIDED', 'Permintaan sudah diputuskan.', {
      status: upgrade.status,
    });
  }
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const decision = requireString(fields, input.decision, 'decision');
  if (Object.keys(fields).length > 0) throw validationError(fields);
  if (decision !== 'APPROVE' && decision !== 'REJECT') {
    throw validationError({ decision: 'Keputusan harus APPROVE atau REJECT.' });
  }
  const reasonCode =
    typeof input.reasonCode === 'string' && input.reasonCode !== '' ? input.reasonCode : null;
  if (decision === 'REJECT' && reasonCode === null) {
    throw new AppError(422, 'REASON_REQUIRED', 'Alasan penolakan wajib dipilih.');
  }
  const reason = reasonCode ? reasonText(db, reasonCode, 'UPGRADE') : null;
  const now = nowIso();

  if (decision === 'APPROVE') {
    const status = upgradeStatus(db, upgrade.mentor_id);
    const missing = (status.checklist as { key: string; status: string }[])
      // The certificate is verified by this decision, so its pending state is
      // not a blocker; existence is checked separately below.
      .filter((item) => item.key !== 'certificate' && item.status !== 'VERIFIED')
      .map((item) => item.key);
    if (missing.length > 0) {
      throw new AppError(409, 'BADGE_PRECONDITIONS_UNMET', 'Prasyarat badge belum terpenuhi.', {
        missing,
      });
    }
    const certificate =
      findCertificateByUpgrade(db, upgrade.id) ?? findLatestCertificate(db, upgrade.mentor_id);
    if (!certificate) {
      throw new AppError(409, 'BADGE_PRECONDITIONS_UNMET', 'Sertifikat coaching belum diunggah.', {
        missing: ['certificate'],
      });
    }
    updateCertificate(db, certificate.id, {
      status: 'VERIFIED',
      verified_at: now,
      verified_by: actor.id,
    });
    updateMentor(db, upgrade.mentor_id, { tier: 'EDUCATOR_PREMIUM' });
    const badge = issueTierBadge(db, upgrade.mentor_id, actor.id, now, 'LMNS_WELL_BEING_CERTIFIED');
    updateUpgrade(db, upgrade.id, {
      status: 'APPROVED',
      decided_at: now,
      decided_by: actor.id,
      decision_reason_code: reasonCode,
    });
    insertAudit(db, {
      id: newId('aud'),
      entity_type: 'UPGRADE',
      entity_id: upgrade.id,
      actor_id: actor.id,
      action: 'APPROVE',
      reason_code: reasonCode,
      note: null,
      created_at: now,
    });
    notifyMentor(db, upgrade.mentor_id, 'BADGE_ISSUED', {
      mentorId: upgrade.mentor_id,
      type: 'LMNS_WELL_BEING_CERTIFIED',
    });
    return {
      upgradeRequestId: upgrade.id,
      status: 'APPROVED',
      badge: badge ? { type: 'LMNS_WELL_BEING_CERTIFIED', issuedAt: now } : null,
      mentorTier: 'EDUCATOR_PREMIUM',
    };
  }

  updateUpgrade(db, upgrade.id, {
    status: 'REJECTED',
    decided_at: now,
    decided_by: actor.id,
    decision_reason_code: reasonCode,
    decision_note: typeof input.note === 'string' ? input.note : null,
  });
  const certificate = findCertificateByUpgrade(db, upgrade.id);
  if (certificate) updateCertificate(db, certificate.id, { status: 'REJECTED' });
  insertAudit(db, {
    id: newId('aud'),
    entity_type: 'UPGRADE',
    entity_id: upgrade.id,
    actor_id: actor.id,
    action: 'REJECT',
    reason_code: reasonCode,
    note: typeof input.note === 'string' ? input.note : null,
    created_at: now,
  });
  notifyMentor(db, upgrade.mentor_id, 'APPLICATION_DECISION', {
    upgradeRequestId: upgrade.id,
    status: 'REJECTED',
    reasonCode,
  });
  const mentor = findMentorByUserId(db, upgrade.mentor_id);
  return {
    upgradeRequestId: upgrade.id,
    status: 'REJECTED',
    badge: null,
    mentorTier: mentor?.tier ?? null,
    reasonText: reason,
  };
}

export function adminMentors(db: Db, query: Record<string, unknown>): Record<string, unknown> {
  const q = typeof query.q === 'string' ? query.q.toLowerCase() : '';
  const tier = typeof query.tier === 'string' && query.tier !== '' ? query.tier : undefined;
  const badgeFilter =
    typeof query.badge === 'string' && query.badge !== '' ? query.badge : undefined;
  const rows = listMentorsByStatus(db, 'APPROVED').filter((mentor) => {
    if (tier && mentor.tier !== tier) return false;
    if (q && !`${mentor.display_name} ${mentor.institution ?? ''}`.toLowerCase().includes(q)) {
      return false;
    }
    if (
      badgeFilter &&
      !listBadges(db, mentor.user_id).some((badge) => badge.type === badgeFilter)
    ) {
      return false;
    }
    return true;
  });
  return {
    items: rows.map((mentor) => ({
      mentor: serializeMentorCard(db, mentor),
      badges: listBadges(db, mentor.user_id).map(serializeBadge),
      status: mentor.status,
    })),
    total: rows.length,
  };
}

export function adminBadgeAction(
  db: Db,
  mentorId: string,
  actor: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const mentor = findMentorByUserId(db, mentorId);
  if (!mentor) throw new AppError(404, 'NOT_FOUND', 'Mentor tidak ditemukan.');
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const action = requireString(fields, input.action, 'action');
  if (Object.keys(fields).length > 0) throw validationError(fields);
  if (action !== 'ISSUE' && action !== 'REVOKE') {
    throw validationError({ action: 'Aksi harus ISSUE atau REVOKE.' });
  }
  const now = nowIso();

  if (action === 'ISSUE') {
    const status = upgradeStatus(db, mentor.user_id);
    const missing = (status.checklist as { key: string; status: string }[])
      .filter((item) => item.status !== 'VERIFIED')
      .map((item) => item.key);
    if (missing.length > 0) {
      throw new AppError(409, 'BADGE_PRECONDITIONS_UNMET', 'Prasyarat badge belum terpenuhi.', {
        missing,
      });
    }
    const badge = issueTierBadge(db, mentor.user_id, actor.id, now, 'LMNS_WELL_BEING_CERTIFIED');
    if (!badge)
      throw new AppError(409, 'BADGE_PRECONDITIONS_UNMET', 'Badge tidak dapat diterbitkan.');
    updateMentor(db, mentor.user_id, { tier: 'EDUCATOR_PREMIUM' });
    const auditId = newId('aud');
    insertAudit(db, {
      id: auditId,
      entity_type: 'BADGE',
      entity_id: String(badge.id),
      actor_id: actor.id,
      action: 'ISSUE',
      reason_code: null,
      note: typeof input.reason === 'string' ? input.reason.slice(0, 500) : null,
      created_at: now,
    });
    return {
      mentor: serializeMentorCard(db, findMentorByUserId(db, mentor.user_id) as typeof mentor),
      badge,
      auditId,
    };
  }

  if (typeof input.reason !== 'string' || input.reason.trim() === '') {
    throw new AppError(422, 'REASON_REQUIRED', 'Alasan pencabutan wajib diisi.');
  }
  const active = findActiveBadge(db, mentor.user_id, 'LMNS_WELL_BEING_CERTIFIED');
  if (!active) throw new AppError(404, 'NOT_FOUND', 'Badge aktif tidak ditemukan.');
  updateBadge(db, active.id, { revoked_at: now, revoke_reason: input.reason.slice(0, 500) });
  insertBadgeEvent(db, {
    id: newId('bev'),
    badgeId: active.id,
    action: 'REVOKE',
    actorId: actor.id,
    reason: input.reason.slice(0, 500),
    createdAt: now,
  });
  // Demote to the last verifiable tier: S3 + overseas evidence keeps Standard.
  const approved = findApprovedApplication(db, mentor.user_id);
  const evidence = approved
    ? Object.fromEntries(listEvidence(db, approved.id).map((row) => [row.key, row.value]))
    : {};
  updateMentor(db, mentor.user_id, {
    tier: evidence.s3VerificationUrl ? 'EDUCATOR_STANDARD' : 'BASIC',
  });
  const auditId = newId('aud');
  insertAudit(db, {
    id: auditId,
    entity_type: 'BADGE',
    entity_id: active.id,
    actor_id: actor.id,
    action: 'REVOKE',
    reason_code: null,
    note: input.reason.slice(0, 500),
    created_at: now,
  });
  const updated = db
    .prepare(
      'SELECT * FROM mentor_badges WHERE mentor_id = ? AND type = ? ORDER BY issued_at DESC LIMIT 1',
    )
    .get(mentor.user_id, active.type) as BadgeRow | undefined;
  return {
    mentor: serializeMentorCard(db, findMentorByUserId(db, mentor.user_id) as typeof mentor),
    badge: serializeBadge(updated as NonNullable<typeof updated>),
    auditId,
  };
}

export function adminDomainCheck(db: Db, body: unknown): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const email = requireString(fields, input.email, 'email', { max: 200 });
  if (email !== null && !isEmail(email)) fields.email = 'Format email tidak valid.';
  if (Object.keys(fields).length > 0) throw validationError(fields);
  return domainCheck(db, email as string);
}

export function adminAudit(db: Db, query: Record<string, unknown>): Record<string, unknown> {
  const { page, pageSize, offset } = readPagination(query);
  const entityType =
    typeof query.entityType === 'string' && query.entityType !== '' ? query.entityType : undefined;
  const entityId =
    typeof query.entityId === 'string' && query.entityId !== '' ? query.entityId : undefined;
  const { rows, total } = listAudit(db, { entityType, entityId, limit: pageSize, offset });
  return { items: rows.map(serializeAudit), page, pageSize, total };
}

// --- Notifications ---------------------------------------------------------

export function notifications(
  db: Db,
  user: AuthUser,
  query: Record<string, unknown>,
): Record<string, unknown> {
  const unreadOnly = query.unreadOnly === 'true' || query.unreadOnly === '1';
  const rows = listNotifications(db, user.id, unreadOnly);
  return {
    items: rows.map(serializeNotification),
    unreadCount: unreadCount(db, user.id),
  };
}

export function readNotification(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const row = findNotification(db, id);
  if (!row || row.user_id !== user.id)
    throw new AppError(404, 'NOT_FOUND', 'Notifikasi tidak ditemukan.');
  if (row.read_at === null) {
    markNotificationRead(db, id, nowIso());
  }
  const updated = findNotification(db, id);
  return { id, readAt: updated?.read_at ?? null };
}
