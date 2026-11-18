import type { Db } from '../db/index.js';
import { nowIso, parseJson } from '../lib/helpers.js';

export type Tier = 'BASIC' | 'EDUCATOR_STANDARD' | 'EDUCATOR_PREMIUM';
export type MentorStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
export type ApplicationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export interface MentorRow {
  user_id: string;
  slug: string;
  display_name: string;
  academic_title: string | null;
  institution: string | null;
  discipline: string | null;
  tier: Tier;
  status: MentorStatus;
  listed_at: string | null;
  session_fee_idr: number;
  languages: string;
  formats: string;
  research_focus_json: string;
  overseas_destinations_json: string;
  degree_focus_json: string;
  verified_links_json: string;
  source_application_id: string | null;
}

export interface StorefrontRow {
  id: string;
  application_id: string | null;
  mentor_id: string | null;
  niche: string | null;
  intro: string | null;
  well_being_philosophy: string | null;
  intro_video_url: string | null;
  strengths_json: string;
  languages_json: string;
  formats_json: string;
  overseas_destinations_json: string;
  published: number;
  updated_at: string;
}

export interface PackageRow {
  id: string;
  storefront_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  price_idr: number;
  is_free_consultation: number;
  position: number;
}

export interface ApplicationRow {
  id: string;
  mentor_id: string;
  tier: Tier;
  status: ApplicationStatus;
  current_step: string;
  display_name: string | null;
  academic_title: string | null;
  institution: string | null;
  discipline: string | null;
  submitted_at: string | null;
  sla_due_at: string | null;
  decided_at: string | null;
  decision_reason_code: string | null;
  decision_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvidenceRow {
  application_id: string;
  key: string;
  mentor_id: string;
  value: string;
  verified_at: string | null;
  verified_by: string | null;
}

export interface SelfAssessmentRow {
  application_id: string;
  philosophy: string;
  boundaries: string;
  burnout_approach: string;
  completed_at: string;
}

export interface ApplicationEventRow {
  id: string;
  application_id: string;
  status: string;
  actor_id: string;
  note: string | null;
  created_at: string;
}

export interface BadgeRow {
  id: string;
  mentor_id: string;
  type: string;
  issued_at: string;
  issued_by: string;
  revoked_at: string | null;
  revoke_reason: string | null;
  status: 'ACTIVE' | 'REVOKED';
}

export interface UpgradeRow {
  id: string;
  mentor_id: string;
  status: 'DRAFT' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  submitted_at: string | null;
  decided_at: string | null;
  decided_by: string | null;
  decision_reason_code: string | null;
  decision_note: string | null;
  created_at: string;
}

export interface CertificateRow {
  id: string;
  upgrade_request_id: string;
  file_name: string;
  issuer: string;
  file_url: string;
  issued_at: string;
  expires_at: string;
  verified_at: string | null;
  verified_by: string | null;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
}

export interface TrainingModuleRow {
  id: string;
  title: string;
  content: string;
  duration_minutes: number;
  position: number;
}

// --- Mentor profiles -------------------------------------------------------

export function findMentorByUserId(db: Db, userId: string): MentorRow | undefined {
  return db.prepare('SELECT * FROM mentor_profiles WHERE user_id = ?').get(userId) as
    MentorRow | undefined;
}

export function findMentorBySlug(db: Db, slug: string): MentorRow | undefined {
  return db.prepare('SELECT * FROM mentor_profiles WHERE slug = ?').get(slug) as
    MentorRow | undefined;
}

export function insertMentor(db: Db, row: MentorRow): void {
  db.prepare(
    `INSERT INTO mentor_profiles
       (user_id, slug, display_name, academic_title, institution, discipline, tier, status,
        listed_at, session_fee_idr, languages, formats, research_focus_json,
        overseas_destinations_json, degree_focus_json, verified_links_json, source_application_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.user_id,
    row.slug,
    row.display_name,
    row.academic_title,
    row.institution,
    row.discipline,
    row.tier,
    row.status,
    row.listed_at,
    row.session_fee_idr,
    row.languages,
    row.formats,
    row.research_focus_json,
    row.overseas_destinations_json,
    row.degree_focus_json,
    row.verified_links_json,
    row.source_application_id,
  );
}

export function updateMentor(db: Db, userId: string, patch: Partial<MentorRow>): void {
  const keys = Object.keys(patch) as (keyof MentorRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  const values = keys.map((key) => patch[key]);
  db.prepare(`UPDATE mentor_profiles SET ${assignments} WHERE user_id = ?`).run(
    ...(values as (string | number | null)[]),
    userId,
  );
}

export function listApprovedMentors(db: Db): MentorRow[] {
  return db
    .prepare(
      `SELECT m.* FROM mentor_profiles m
         JOIN users u ON u.id = m.user_id
        WHERE m.status = 'APPROVED' AND u.email_verified_at IS NOT NULL
        ORDER BY m.display_name ASC`,
    )
    .all() as unknown as MentorRow[];
}

export function listMentorsByStatus(db: Db, status?: MentorStatus): MentorRow[] {
  const rows = status
    ? (db
        .prepare('SELECT * FROM mentor_profiles WHERE status = ? ORDER BY display_name')
        .all(status) as unknown as MentorRow[])
    : (db
        .prepare('SELECT * FROM mentor_profiles ORDER BY display_name')
        .all() as unknown as MentorRow[]);
  return rows;
}

// --- Storefront and packages ----------------------------------------------

export function findStorefrontByMentor(db: Db, mentorId: string): StorefrontRow | undefined {
  return db.prepare('SELECT * FROM mentor_storefronts WHERE mentor_id = ?').get(mentorId) as
    StorefrontRow | undefined;
}

export function findStorefrontByApplication(
  db: Db,
  applicationId: string,
): StorefrontRow | undefined {
  return db
    .prepare('SELECT * FROM mentor_storefronts WHERE application_id = ?')
    .get(applicationId) as StorefrontRow | undefined;
}

export function insertStorefront(db: Db, row: StorefrontRow): void {
  db.prepare(
    `INSERT INTO mentor_storefronts
       (id, application_id, mentor_id, niche, intro, well_being_philosophy, intro_video_url,
        strengths_json, languages_json, formats_json, overseas_destinations_json, published, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.application_id,
    row.mentor_id,
    row.niche,
    row.intro,
    row.well_being_philosophy,
    row.intro_video_url,
    row.strengths_json,
    row.languages_json,
    row.formats_json,
    row.overseas_destinations_json,
    row.published,
    row.updated_at,
  );
}

export function updateStorefront(db: Db, id: string, patch: Partial<StorefrontRow>): void {
  const keys = Object.keys(patch) as (keyof StorefrontRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE mentor_storefronts SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | number | null)[]),
    id,
  );
}

export function listPackages(db: Db, storefrontId: string): PackageRow[] {
  return db
    .prepare('SELECT * FROM storefront_packages WHERE storefront_id = ? ORDER BY position, id')
    .all(storefrontId) as unknown as PackageRow[];
}

export function findPackage(db: Db, packageId: string): PackageRow | undefined {
  return db.prepare('SELECT * FROM storefront_packages WHERE id = ?').get(packageId) as
    PackageRow | undefined;
}

export function replacePackages(
  db: Db,
  storefrontId: string,
  packages: Omit<PackageRow, 'storefront_id' | 'position'>[],
): void {
  db.prepare('DELETE FROM storefront_packages WHERE storefront_id = ?').run(storefrontId);
  const insert = db.prepare(
    `INSERT INTO storefront_packages
       (id, storefront_id, title, description, duration_minutes, price_idr, is_free_consultation, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  packages.forEach((pkg, index) => {
    insert.run(
      pkg.id,
      storefrontId,
      pkg.title,
      pkg.description,
      pkg.duration_minutes,
      pkg.price_idr,
      pkg.is_free_consultation,
      index,
    );
  });
}

/** Starting fee: cheapest non-free package, or 0 when a free consultation exists. */
export function startingFee(packages: PackageRow[]): number {
  if (packages.some((pkg) => pkg.is_free_consultation === 1 || pkg.price_idr === 0)) return 0;
  if (packages.length === 0) return 0;
  return Math.min(...packages.map((pkg) => pkg.price_idr));
}

// --- Applications ----------------------------------------------------------

export function findApplicationById(db: Db, id: string): ApplicationRow | undefined {
  return db.prepare('SELECT * FROM mentor_applications WHERE id = ?').get(id) as
    ApplicationRow | undefined;
}

export function findLatestApplication(db: Db, mentorId: string): ApplicationRow | undefined {
  return db
    .prepare(
      'SELECT * FROM mentor_applications WHERE mentor_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
    )
    .get(mentorId) as ApplicationRow | undefined;
}

export function findOpenApplication(db: Db, mentorId: string): ApplicationRow | undefined {
  return db
    .prepare(
      "SELECT * FROM mentor_applications WHERE mentor_id = ? AND status IN ('DRAFT','PENDING_REVIEW') ORDER BY created_at DESC LIMIT 1",
    )
    .get(mentorId) as ApplicationRow | undefined;
}

export function findApprovedApplication(db: Db, mentorId: string): ApplicationRow | undefined {
  return db
    .prepare(
      "SELECT * FROM mentor_applications WHERE mentor_id = ? AND status = 'APPROVED' ORDER BY decided_at DESC LIMIT 1",
    )
    .get(mentorId) as ApplicationRow | undefined;
}

export function insertApplication(db: Db, row: ApplicationRow): void {
  db.prepare(
    `INSERT INTO mentor_applications
       (id, mentor_id, tier, status, current_step, display_name, academic_title, institution, discipline,
        submitted_at, sla_due_at, decided_at, decision_reason_code, decision_note, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.mentor_id,
    row.tier,
    row.status,
    row.current_step,
    row.display_name,
    row.academic_title,
    row.institution,
    row.discipline,
    row.submitted_at,
    row.sla_due_at,
    row.decided_at,
    row.decision_reason_code,
    row.decision_note,
    row.created_at,
    row.updated_at,
  );
}

export function updateApplication(db: Db, id: string, patch: Partial<ApplicationRow>): void {
  const keys = Object.keys(patch) as (keyof ApplicationRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE mentor_applications SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | number | null)[]),
    id,
  );
}

export interface ApplicationFilter {
  status?: string;
  tier?: string;
  sort?: string;
  limit: number;
  offset: number;
}

export function listApplications(
  db: Db,
  filter: ApplicationFilter,
): {
  rows: ApplicationRow[];
  total: number;
} {
  const where: string[] = [];
  const params: string[] = [];
  if (filter.status) {
    where.push('status = ?');
    params.push(filter.status);
  }
  if (filter.tier) {
    where.push('tier = ?');
    params.push(filter.tier);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const order =
    filter.sort === 'submittedAt'
      ? 'submitted_at IS NULL, submitted_at DESC'
      : 'sla_due_at IS NULL, sla_due_at ASC';
  const rows = db
    .prepare(`SELECT * FROM mentor_applications ${clause} ORDER BY ${order} LIMIT ? OFFSET ?`)
    .all(...params, filter.limit, filter.offset) as unknown as ApplicationRow[];
  const total = (
    db.prepare(`SELECT COUNT(*) AS count FROM mentor_applications ${clause}`).get(...params) as {
      count: number;
    }
  ).count;
  return { rows, total };
}

export function countApplicationsByStatus(db: Db): Record<string, number> {
  const rows = db
    .prepare('SELECT status, COUNT(*) AS count FROM mentor_applications GROUP BY status')
    .all() as { status: string; count: number }[];
  return Object.fromEntries(rows.map((row) => [row.status, row.count]));
}

export function listEvidence(db: Db, applicationId: string): EvidenceRow[] {
  return db
    .prepare('SELECT * FROM application_evidence WHERE application_id = ? ORDER BY key')
    .all(applicationId) as unknown as EvidenceRow[];
}

export function upsertEvidence(db: Db, row: EvidenceRow): void {
  db.prepare(
    `INSERT INTO application_evidence (application_id, key, mentor_id, value, verified_at, verified_by)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT (application_id, key) DO UPDATE SET value = excluded.value`,
  ).run(row.application_id, row.key, row.mentor_id, row.value, row.verified_at, row.verified_by);
}

export function findSelfAssessment(db: Db, applicationId: string): SelfAssessmentRow | undefined {
  return db
    .prepare('SELECT * FROM mentor_self_assessments WHERE application_id = ?')
    .get(applicationId) as SelfAssessmentRow | undefined;
}

export function upsertSelfAssessment(db: Db, row: SelfAssessmentRow): void {
  db.prepare(
    `INSERT INTO mentor_self_assessments (application_id, philosophy, boundaries, burnout_approach, completed_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT (application_id) DO UPDATE SET
       philosophy = excluded.philosophy,
       boundaries = excluded.boundaries,
       burnout_approach = excluded.burnout_approach,
       completed_at = excluded.completed_at`,
  ).run(row.application_id, row.philosophy, row.boundaries, row.burnout_approach, row.completed_at);
}

export function insertApplicationEvent(db: Db, row: ApplicationEventRow): void {
  db.prepare(
    'INSERT INTO application_events (id, application_id, status, actor_id, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(row.id, row.application_id, row.status, row.actor_id, row.note, row.created_at);
}

export function listApplicationEvents(db: Db, applicationId: string): ApplicationEventRow[] {
  return db
    .prepare('SELECT * FROM application_events WHERE application_id = ? ORDER BY created_at, id')
    .all(applicationId) as unknown as ApplicationEventRow[];
}

// --- Badges ----------------------------------------------------------------

export function listBadges(db: Db, mentorId: string): BadgeRow[] {
  return db
    .prepare('SELECT * FROM mentor_badges WHERE mentor_id = ? ORDER BY issued_at, id')
    .all(mentorId) as unknown as BadgeRow[];
}

export function listActiveBadges(db: Db, mentorId: string): BadgeRow[] {
  return db
    .prepare(
      "SELECT * FROM mentor_badges WHERE mentor_id = ? AND status = 'ACTIVE' ORDER BY issued_at, id",
    )
    .all(mentorId) as unknown as BadgeRow[];
}

export function findActiveBadge(db: Db, mentorId: string, type: string): BadgeRow | undefined {
  return db
    .prepare("SELECT * FROM mentor_badges WHERE mentor_id = ? AND type = ? AND status = 'ACTIVE'")
    .get(mentorId, type) as BadgeRow | undefined;
}

export function insertBadge(db: Db, row: BadgeRow): void {
  db.prepare(
    `INSERT INTO mentor_badges (id, mentor_id, type, issued_at, issued_by, revoked_at, revoke_reason, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.mentor_id,
    row.type,
    row.issued_at,
    row.issued_by,
    row.revoked_at,
    row.revoke_reason,
    row.status,
  );
}

export function updateBadge(db: Db, id: string, patch: Partial<BadgeRow>): void {
  const keys = Object.keys(patch) as (keyof BadgeRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE mentor_badges SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | null)[]),
    id,
  );
}

export function insertBadgeEvent(
  db: Db,
  row: {
    id: string;
    badgeId: string;
    action: 'ISSUE' | 'REVOKE';
    actorId: string;
    reason: string | null;
    createdAt: string;
  },
): void {
  db.prepare(
    'INSERT INTO mentor_badge_events (id, badge_id, action, actor_id, reason, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(row.id, row.badgeId, row.action, row.actorId, row.reason, row.createdAt);
}

// --- Premium upgrades ------------------------------------------------------

export function findOpenUpgrade(db: Db, mentorId: string): UpgradeRow | undefined {
  return db
    .prepare(
      "SELECT * FROM premium_upgrade_requests WHERE mentor_id = ? AND status IN ('DRAFT','PENDING_VERIFICATION') ORDER BY created_at DESC LIMIT 1",
    )
    .get(mentorId) as UpgradeRow | undefined;
}

export function findUpgradeById(db: Db, id: string): UpgradeRow | undefined {
  return db.prepare('SELECT * FROM premium_upgrade_requests WHERE id = ?').get(id) as
    UpgradeRow | undefined;
}

export function findLatestUpgrade(db: Db, mentorId: string): UpgradeRow | undefined {
  return db
    .prepare(
      'SELECT * FROM premium_upgrade_requests WHERE mentor_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
    )
    .get(mentorId) as UpgradeRow | undefined;
}

export function insertUpgrade(db: Db, row: UpgradeRow): void {
  db.prepare(
    `INSERT INTO premium_upgrade_requests
       (id, mentor_id, status, submitted_at, decided_at, decided_by, decision_reason_code, decision_note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.mentor_id,
    row.status,
    row.submitted_at,
    row.decided_at,
    row.decided_by,
    row.decision_reason_code,
    row.decision_note,
    row.created_at,
  );
}

export function updateUpgrade(db: Db, id: string, patch: Partial<UpgradeRow>): void {
  const keys = Object.keys(patch) as (keyof UpgradeRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE premium_upgrade_requests SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | null)[]),
    id,
  );
}

export function listUpgrades(db: Db, status?: string): UpgradeRow[] {
  return status
    ? (db
        .prepare('SELECT * FROM premium_upgrade_requests WHERE status = ? ORDER BY submitted_at')
        .all(status) as unknown as UpgradeRow[])
    : (db
        .prepare('SELECT * FROM premium_upgrade_requests ORDER BY created_at DESC')
        .all() as unknown as UpgradeRow[]);
}

export function findCertificateByUpgrade(db: Db, upgradeId: string): CertificateRow | undefined {
  return db
    .prepare(
      'SELECT * FROM mentor_certificates WHERE upgrade_request_id = ? ORDER BY issued_at DESC LIMIT 1',
    )
    .get(upgradeId) as CertificateRow | undefined;
}

export function findLatestCertificate(db: Db, mentorId: string): CertificateRow | undefined {
  return db
    .prepare(
      `SELECT c.* FROM mentor_certificates c
         JOIN premium_upgrade_requests r ON r.id = c.upgrade_request_id
        WHERE r.mentor_id = ? ORDER BY c.issued_at DESC, c.id DESC LIMIT 1`,
    )
    .get(mentorId) as CertificateRow | undefined;
}

export function insertCertificate(db: Db, row: CertificateRow): void {
  db.prepare(
    `INSERT INTO mentor_certificates
       (id, upgrade_request_id, file_name, issuer, file_url, issued_at, expires_at, verified_at, verified_by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.upgrade_request_id,
    row.file_name,
    row.issuer,
    row.file_url,
    row.issued_at,
    row.expires_at,
    row.verified_at,
    row.verified_by,
    row.status,
  );
}

export function updateCertificate(db: Db, id: string, patch: Partial<CertificateRow>): void {
  const keys = Object.keys(patch) as (keyof CertificateRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE mentor_certificates SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | null)[]),
    id,
  );
}

// --- Training --------------------------------------------------------------

export function listTrainingModules(db: Db): TrainingModuleRow[] {
  return db
    .prepare('SELECT * FROM training_modules ORDER BY position, id')
    .all() as unknown as TrainingModuleRow[];
}

export function findTrainingModule(db: Db, id: string): TrainingModuleRow | undefined {
  return db.prepare('SELECT * FROM training_modules WHERE id = ?').get(id) as
    TrainingModuleRow | undefined;
}

export function completedModuleIds(db: Db, mentorId: string): Set<string> {
  const rows = db
    .prepare('SELECT module_id FROM training_progress WHERE mentor_id = ?')
    .all(mentorId) as { module_id: string }[];
  return new Set(rows.map((row) => row.module_id));
}

export function completeModule(db: Db, mentorId: string, moduleId: string, at: string): void {
  db.prepare(
    'INSERT INTO training_progress (mentor_id, module_id, completed_at) VALUES (?, ?, ?) ON CONFLICT DO NOTHING',
  ).run(mentorId, moduleId, at);
}

export function insertTrainingAttempt(
  db: Db,
  row: {
    id: string;
    mentorId: string;
    score: number;
    passed: boolean;
    answers: unknown;
    createdAt: string;
  },
): void {
  db.prepare(
    'INSERT INTO training_attempts (id, mentor_id, module_batch, score, passed, answers_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    row.id,
    row.mentorId,
    'premium-1',
    row.score,
    row.passed ? 1 : 0,
    JSON.stringify(row.answers),
    row.createdAt,
  );
}

export function listTrainingAttempts(
  db: Db,
  mentorId: string,
): {
  id: string;
  mentor_id: string;
  module_batch: string;
  score: number;
  passed: number;
  answers_json: string;
  created_at: string;
}[] {
  return db
    .prepare(
      'SELECT * FROM training_attempts WHERE mentor_id = ? ORDER BY created_at DESC, id DESC',
    )
    .all(mentorId) as {
    id: string;
    mentor_id: string;
    module_batch: string;
    score: number;
    passed: number;
    answers_json: string;
    created_at: string;
  }[];
}

export function buildStorefront(row: StorefrontRow): {
  id: string;
  niche: string | null;
  strengths: string[];
  languages: string[];
  formats: string[];
  intro: string | null;
  introVideoUrl: string | null;
  wellBeingPhilosophy: string | null;
  overseasDestinations: string[];
  published: boolean;
} {
  return {
    id: row.id,
    niche: row.niche,
    strengths: parseJson<string[]>(row.strengths_json, []),
    languages: parseJson<string[]>(row.languages_json, []),
    formats: parseJson<string[]>(row.formats_json, []),
    intro: row.intro,
    introVideoUrl: row.intro_video_url,
    wellBeingPhilosophy: row.well_being_philosophy,
    overseasDestinations: parseJson<string[]>(row.overseas_destinations_json, []),
    published: row.published === 1,
  };
}

export function touchStorefront(db: Db, id: string): void {
  updateStorefront(db, id, { updated_at: nowIso() });
}
