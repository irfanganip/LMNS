import type { Db } from '../db/index.js';
import { config } from '../config.js';
import { AppError } from '../http/errors.js';
import type { AuthUser } from '../http/auth.js';
import { asRecord, isHttpUrl, requireString, validationError } from '../lib/validate.js';
import { addDays, newId, nowIso, parseJson, readList as readBodyList } from '../lib/helpers.js';
import {
  findApplicationById,
  findApprovedApplication,
  findLatestApplication,
  findOpenApplication,
  findSelfAssessment,
  findStorefrontByApplication,
  findStorefrontByMentor,
  insertApplication,
  insertApplicationEvent,
  insertStorefront,
  listApplicationEvents,
  listEvidence,
  listPackages,
  replacePackages,
  updateApplication,
  updateStorefront,
  upsertEvidence,
  upsertSelfAssessment,
  type ApplicationRow,
  type EvidenceRow,
  type MentorRow,
  type SelfAssessmentRow,
  type StorefrontRow,
  type Tier,
} from '../repos/mentors.js';
import { insertNotification, listAdminIds } from '../repos/admin.js';
import { findUserById } from '../repos/identity.js';
import { findMentorByUserId, insertMentor, updateMentor } from '../repos/mentors.js';
import { serializeApplication } from '../serializers.js';

const TIERS: Tier[] = ['BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM'];

export const EVIDENCE_REQUIRED: Record<Tier, string[]> = {
  BASIC: [
    'degreeUrl',
    'overseasExperienceUrl',
    'organisationUrl',
    'googleScholarUrl',
    'linkedinUrl',
  ],
  EDUCATOR_STANDARD: [
    's3VerificationUrl',
    'sisterId',
    'institutionalEmailVerified',
    'googleScholarUrl',
    'linkedinUrl',
  ],
  EDUCATOR_PREMIUM: [
    's3VerificationUrl',
    'overseasExperienceUrl',
    'scopusId',
    'googleScholarUrl',
    'linkedinUrl',
    'certificateUrl',
  ],
};

export const EVIDENCE_LABELS: Record<string, string> = {
  degreeUrl: 'Ijazah (tautan)',
  overseasExperienceUrl: 'Bukti pengalaman luar negeri',
  organisationUrl: 'Profil organisasi / institusi',
  googleScholarUrl: 'Google Scholar',
  linkedinUrl: 'LinkedIn',
  s3VerificationUrl: 'Verifikasi S3 / NIDN',
  sisterId: 'SISTER ID',
  institutionalEmailVerified: 'Email institusi terverifikasi',
  scopusId: 'Scopus ID',
  orcidId: 'ORCID',
  certificateUrl: 'Sertifikat coaching',
};

export const EVIDENCE_ALLOWED: Record<Tier, string[]> = {
  BASIC: EVIDENCE_REQUIRED.BASIC,
  EDUCATOR_STANDARD: EVIDENCE_REQUIRED.EDUCATOR_STANDARD,
  EDUCATOR_PREMIUM: [...EVIDENCE_REQUIRED.EDUCATOR_PREMIUM, 'orcidId'],
};

function assertOwner(application: ApplicationRow, user: AuthUser): void {
  if (application.mentor_id !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'Aplikasi ini milik mentor lain.');
  }
}

export function findOwnedApplication(db: Db, id: string, user: AuthUser): ApplicationRow {
  const application = findApplicationById(db, id);
  if (!application) throw new AppError(404, 'NOT_FOUND', 'Aplikasi tidak ditemukan.');
  assertOwner(application, user);
  return application;
}

/** Editable states; a rejected/withdrawn application returns to DRAFT on edit. */
function ensureEditable(db: Db, application: ApplicationRow): ApplicationRow {
  if (application.status === 'PENDING_REVIEW' || application.status === 'APPROVED') {
    throw new AppError(409, 'INVALID_APPLICATION_STATE', 'Aplikasi tidak dapat diedit saat ini.', {
      status: application.status,
    });
  }
  if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') {
    updateApplication(db, application.id, { status: 'DRAFT', updated_at: nowIso() });
    const updated = findApplicationById(db, application.id) as ApplicationRow;
    insertApplicationEvent(db, {
      id: newId('evo'),
      application_id: application.id,
      status: 'DRAFT',
      actor_id: application.mentor_id,
      note: 'Aplikasi dibuka kembali untuk revisi.',
      created_at: nowIso(),
    });
    return updated;
  }
  return application;
}

function evidenceValues(db: Db, applicationId: string): Record<string, string> {
  const rows = listEvidence(db, applicationId);
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export function missingEvidence(db: Db, application: ApplicationRow): string[] {
  const values = evidenceValues(db, application.id);
  const missing: string[] = [];
  for (const key of EVIDENCE_REQUIRED[application.tier]) {
    if (key === 'scopusId') {
      if (!values.scopusId && !values.orcidId) missing.push('scopusId');
      continue;
    }
    if (!values[key]) missing.push(key);
  }
  return missing;
}

export function missingItemsFor(
  db: Db,
  application: ApplicationRow,
): { key: string; label: string }[] {
  const items = missingEvidence(db, application).map((key) => ({
    key,
    label: EVIDENCE_LABELS[key] ?? key,
  }));
  if (application.status === 'DRAFT') {
    if (!findSelfAssessment(db, application.id)) {
      items.push({ key: 'selfAssessment', label: 'Asesmen diri kesejahteraan' });
    }
    if (needsPackage(application) && packageCount(db, application) === 0) {
      items.push({ key: 'packages', label: 'Paket sesi' });
    }
  }
  return items;
}

function needsPackage(application: ApplicationRow): boolean {
  return application.tier === 'EDUCATOR_STANDARD' || application.tier === 'EDUCATOR_PREMIUM';
}

function packageCount(db: Db, application: ApplicationRow): number {
  const storefront = findStorefrontByApplication(db, application.id);
  return storefront ? listPackages(db, storefront.id).length : 0;
}

export function applicationView(db: Db, application: ApplicationRow): Record<string, unknown> {
  const selfAssessment = findSelfAssessment(db, application.id);
  return serializeApplication(db, application, {
    evidence: listEvidence(db, application.id).map((row) => ({ key: row.key, value: row.value })),
    missingItems: missingItemsFor(db, application),
    storefront: findStorefrontByApplication(db, application.id) ?? null,
    selfAssessment: selfAssessment
      ? {
          philosophy: selfAssessment.philosophy,
          boundaries: selfAssessment.boundaries,
          burnoutApproach: selfAssessment.burnout_approach,
        }
      : null,
    history: listApplicationEvents(db, application.id).map((event) => ({
      status: event.status,
      at: event.created_at,
      actorId: event.actor_id,
    })),
  });
}

export function createApplication(db: Db, user: AuthUser, body: unknown): Record<string, unknown> {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const tier = requireString(fields, input.tier, 'tier');
  if (tier !== null && !TIERS.includes(tier as Tier)) {
    fields.tier = 'Tier tidak dikenal.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const open = findOpenApplication(db, user.id);
  if (open) {
    throw new AppError(409, 'APPLICATION_IN_PROGRESS', 'Masih ada aplikasi yang sedang berjalan.', {
      applicationId: open.id,
    });
  }

  const now = nowIso();
  const application: ApplicationRow = {
    id: newId('app'),
    mentor_id: user.id,
    tier: tier as Tier,
    status: 'DRAFT',
    current_step: 'IDENTITY',
    display_name: null,
    academic_title: null,
    institution: null,
    discipline: null,
    submitted_at: null,
    sla_due_at: null,
    decided_at: null,
    decision_reason_code: null,
    decision_note: null,
    created_at: now,
    updated_at: now,
  };
  insertApplication(db, application);
  insertApplicationEvent(db, {
    id: newId('evo'),
    application_id: application.id,
    status: 'DRAFT',
    actor_id: user.id,
    note: 'Aplikasi dibuat.',
    created_at: now,
  });
  return applicationView(db, application);
}

export function currentApplication(db: Db, user: AuthUser): Record<string, unknown> | null {
  const application = findLatestApplication(db, user.id);
  return application ? applicationView(db, application) : null;
}

export function updateIdentity(
  db: Db,
  id: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const application = ensureEditable(db, findOwnedApplication(db, id, user));
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};

  const displayName =
    input.displayName === undefined
      ? null
      : requireString(fields, input.displayName, 'displayName', { max: 120 });
  const academicTitle =
    input.academicTitle === undefined
      ? null
      : requireString(fields, input.academicTitle, 'academicTitle', { max: 120 });
  const institution =
    input.institution === undefined
      ? null
      : requireString(fields, input.institution, 'institution', { max: 200 });
  const discipline =
    input.discipline === undefined
      ? null
      : requireString(fields, input.discipline, 'discipline', { max: 80 });

  const evidence = asRecord(input.evidence) ?? {};
  const allowed = EVIDENCE_ALLOWED[application.tier];
  for (const key of Object.keys(evidence)) {
    if (!allowed.includes(key)) {
      fields[`evidence.${key}`] = `Bukti ini tidak diperlukan untuk tier ${application.tier}.`;
    }
  }
  for (const [key, value] of Object.entries(evidence)) {
    if (!allowed.includes(key)) continue;
    validateEvidenceValue(fields, key, value);
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const patch: Partial<ApplicationRow> = { updated_at: nowIso() };
  if (displayName !== null) patch.display_name = displayName;
  if (academicTitle !== null) patch.academic_title = academicTitle;
  if (institution !== null) patch.institution = institution;
  if (discipline !== null) patch.discipline = discipline;
  if (application.current_step === 'IDENTITY') patch.current_step = 'SELF_ASSESSMENT';
  updateApplication(db, application.id, patch);

  for (const [key, value] of Object.entries(evidence)) {
    if (!allowed.includes(key)) continue;
    upsertEvidence(db, {
      application_id: application.id,
      key,
      mentor_id: user.id,
      value: String(value),
      verified_at: null,
      verified_by: null,
    });
  }

  syncMentorDraft(db, application.id);
  return applicationView(db, findApplicationById(db, application.id) as ApplicationRow);
}

function validateEvidenceValue(fields: Record<string, string>, key: string, value: unknown): void {
  if (key === 'institutionalEmailVerified') {
    if (value !== true) fields[`evidence.${key}`] = 'Email institusi harus terverifikasi.';
    return;
  }
  if (key === 'sisterId') {
    if (typeof value !== 'string' || !/^\d{10}$/.test(value)) {
      fields[`evidence.${key}`] = 'SISTER ID harus 10 digit.';
    }
    return;
  }
  if (key === 'scopusId') {
    if (typeof value !== 'string' || !/^\d+$/.test(value)) {
      fields[`evidence.${key}`] = 'Scopus ID harus berupa angka.';
    }
    return;
  }
  if (key === 'orcidId') {
    if (typeof value !== 'string' || !/^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(value)) {
      fields[`evidence.${key}`] = 'Format ORCID tidak valid.';
    }
    return;
  }
  if (!isHttpUrl(value)) {
    fields[`evidence.${key}`] = 'Tautan harus diawali http:// atau https://.';
  }
}

export function saveSelfAssessment(
  db: Db,
  id: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const application = ensureEditable(db, findOwnedApplication(db, id, user));
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const philosophy = requireString(fields, input.philosophy, 'philosophy', { min: 40, max: 1200 });
  const boundaries = requireString(fields, input.boundaries, 'boundaries', { min: 40, max: 1200 });
  const burnoutApproach = requireString(fields, input.burnoutApproach, 'burnoutApproach', {
    min: 40,
    max: 1200,
  });
  if (Object.keys(fields).length > 0) throw validationError(fields);

  upsertSelfAssessment(db, {
    application_id: application.id,
    philosophy: philosophy as string,
    boundaries: boundaries as string,
    burnout_approach: burnoutApproach as string,
    completed_at: nowIso(),
  });
  if (application.current_step === 'SELF_ASSESSMENT') {
    updateApplication(db, application.id, { current_step: 'STORE_FRONT', updated_at: nowIso() });
  }
  return applicationView(db, findApplicationById(db, application.id) as ApplicationRow);
}

interface StorefrontInput {
  niche: string;
  strengths: string[];
  languages: string[];
  formats: string[];
  intro: string;
  introVideoUrl: string | null;
  wellBeingPhilosophy: string;
  overseasDestinations: string[];
  packages: {
    title: string;
    description: string;
    durationMinutes: number;
    priceIdr: number;
    isFreeConsultation: boolean;
  }[];
}

function readStorefrontInput(body: unknown): StorefrontInput {
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const niche = requireString(fields, input.niche, 'niche', { max: 80 });
  const intro = requireString(fields, input.intro, 'intro', { max: 800 });
  const wellBeingPhilosophy = requireString(
    fields,
    input.wellBeingPhilosophy,
    'wellBeingPhilosophy',
    {
      max: 1200,
    },
  );
  const introVideoUrl =
    input.introVideoUrl === undefined || input.introVideoUrl === null || input.introVideoUrl === ''
      ? null
      : requireString(fields, input.introVideoUrl, 'introVideoUrl');
  if (introVideoUrl !== null && !isHttpUrl(introVideoUrl)) {
    fields.introVideoUrl = 'Tautan harus diawali http:// atau https://.';
  }

  const strengths = readBodyList(input, 'strengths');
  if (strengths.length > 6) fields.strengths = 'Maksimal 6 kekuatan.';
  if (strengths.some((item) => item.length > 60)) {
    fields.strengths = 'Setiap kekuatan maksimal 60 karakter.';
  }
  const languages = readBodyList(input, 'languages');
  if (languages.length === 0) fields.languages = 'Pilih minimal satu bahasa.';
  if (languages.some((item) => !['id', 'en'].includes(item)))
    fields.languages = 'Bahasa harus id atau en.';
  const formats = readBodyList(input, 'formats');
  if (formats.length === 0) fields.formats = 'Pilih minimal satu format.';
  if (formats.some((item) => !['online', 'in-person'].includes(item))) {
    fields.formats = 'Format harus online atau in-person.';
  }
  const overseasDestinations = readBodyList(input, 'overseasDestinations');
  if (overseasDestinations.some((item) => !/^[A-Z]{2}$/.test(item))) {
    fields.overseasDestinations = 'Kode negara harus dua huruf kapital.';
  }

  const rawPackages = Array.isArray(input.packages) ? input.packages : [];
  if (rawPackages.length > 5) fields.packages = 'Maksimal 5 paket.';
  const packageFields: Record<string, string> = {};
  const packages = rawPackages.map((raw, index) => {
    const pkg = asRecord(raw) ?? {};
    const title = requireString(packageFields, pkg.title, `packages[${index}].title`, { max: 120 });
    const description =
      pkg.description === undefined
        ? ''
        : (requireString(packageFields, pkg.description, `packages[${index}].description`, {
            max: 500,
          }) ?? '');
    const durationMinutes = pkg.durationMinutes;
    const priceIdr = pkg.priceIdr;
    const isFreeConsultation = pkg.isFreeConsultation === true;
    if (
      typeof durationMinutes !== 'number' ||
      !Number.isInteger(durationMinutes) ||
      durationMinutes < 30 ||
      durationMinutes > 180
    ) {
      packageFields[`packages[${index}].durationMinutes`] = 'Durasi 30–180 menit.';
    }
    if (
      typeof priceIdr !== 'number' ||
      !Number.isInteger(priceIdr) ||
      priceIdr < 0 ||
      priceIdr > 5_000_000
    ) {
      packageFields[`packages[${index}].priceIdr`] = 'Harga 0–5.000.000 rupiah.';
    }
    return {
      title: title ?? '',
      description,
      durationMinutes: durationMinutes as number,
      priceIdr: priceIdr as number,
      isFreeConsultation,
    };
  });

  if (Object.keys(packageFields).length > 0) {
    throw new AppError(422, 'PACKAGE_INVALID', 'Paket sesi tidak valid.', {
      fields: packageFields,
    });
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  return {
    niche: niche as string,
    strengths,
    languages,
    formats,
    intro: intro as string,
    introVideoUrl,
    wellBeingPhilosophy: wellBeingPhilosophy as string,
    overseasDestinations,
    packages,
  };
}

function applyStorefront(
  db: Db,
  existing: StorefrontRow | undefined,
  owner: { applicationId: string | null; mentorId: string | null },
  input: StorefrontInput,
): StorefrontRow {
  const row: StorefrontRow = {
    id: existing?.id ?? newId('stf'),
    application_id: owner.applicationId,
    mentor_id: owner.mentorId,
    niche: input.niche,
    intro: input.intro,
    well_being_philosophy: input.wellBeingPhilosophy,
    intro_video_url: input.introVideoUrl,
    strengths_json: JSON.stringify(input.strengths),
    languages_json: JSON.stringify(input.languages),
    formats_json: JSON.stringify(input.formats),
    overseas_destinations_json: JSON.stringify(input.overseasDestinations),
    published: existing?.published ?? 0,
    updated_at: nowIso(),
  };
  if (existing) {
    updateStorefront(db, existing.id, row);
  } else {
    insertStorefront(db, row);
  }
  replacePackages(
    db,
    row.id,
    input.packages.map((pkg) => ({
      id: newId('pkg'),
      title: pkg.title,
      description: pkg.description,
      duration_minutes: pkg.durationMinutes,
      price_idr: pkg.priceIdr,
      is_free_consultation: pkg.isFreeConsultation ? 1 : 0,
    })),
  );
  return row;
}

export function saveApplicationStorefront(
  db: Db,
  id: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const application = ensureEditable(db, findOwnedApplication(db, id, user));
  const input = readStorefrontInput(body);
  applyStorefront(
    db,
    findStorefrontByApplication(db, application.id),
    { applicationId: application.id, mentorId: null },
    input,
  );
  if (application.current_step !== 'REVIEW') {
    updateApplication(db, application.id, { current_step: 'REVIEW', updated_at: nowIso() });
  }
  syncMentorDraft(db, application.id);
  return applicationView(db, findApplicationById(db, application.id) as ApplicationRow);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function uniqueSlug(db: Db, base: string, userId: string): string {
  const root = base === '' ? userId.replace(/_/g, '-') : base;
  let candidate = root;
  let counter = 2;
  while (true) {
    const existing = db
      .prepare('SELECT user_id FROM mentor_profiles WHERE slug = ?')
      .get(candidate) as { user_id: string } | undefined;
    if (!existing || existing.user_id === userId) return candidate;
    candidate = `${root}-${counter}`;
    counter += 1;
  }
}

/** Keeps the canonical mentor row in sync while the application is a draft. */
function syncMentorDraft(db: Db, applicationId: string): void {
  const application = findApplicationById(db, applicationId);
  if (!application || application.status === 'APPROVED') return;
  const storefront = findStorefrontByApplication(db, applicationId);
  const values = evidenceValues(db, applicationId);
  const links = {
    googleScholar: values.googleScholarUrl ?? null,
    linkedin: values.linkedinUrl ?? null,
    scopus: values.scopusId ?? null,
    orcid: values.orcidId ?? null,
    institutional: values.s3VerificationUrl ?? values.organisationUrl ?? null,
    sisterId: values.sisterId ?? null,
  };
  const displayedName =
    application.display_name ?? findUserById(db, application.mentor_id)?.email ?? 'Mentor';
  const existing = findMentorByUserId(db, application.mentor_id);
  const row = {
    user_id: application.mentor_id,
    slug: existing?.slug ?? uniqueSlug(db, slugify(displayedName), application.mentor_id),
    display_name: displayedName,
    academic_title: application.academic_title,
    institution: application.institution,
    discipline: application.discipline,
    tier: application.tier,
    status: application.status === 'REJECTED' ? 'REJECTED' : 'PENDING_REVIEW',
    listed_at: null,
    session_fee_idr: existing?.session_fee_idr ?? 0,
    languages: storefront?.languages_json ?? existing?.languages ?? '[]',
    formats: storefront?.formats_json ?? existing?.formats ?? '[]',
    research_focus_json: existing?.research_focus_json ?? '[]',
    overseas_destinations_json:
      storefront?.overseas_destinations_json ?? existing?.overseas_destinations_json ?? '[]',
    degree_focus_json: existing?.degree_focus_json ?? '[]',
    verified_links_json: JSON.stringify(links),
    source_application_id: application.id,
  } as const;
  if (existing) {
    const patch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (key !== 'user_id') patch[key] = value;
    }
    updateMentor(db, application.mentor_id, patch as Partial<MentorRow>);
  } else {
    insertMentor(db, row as MentorRow);
  }
}

export function submitApplication(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const application = findOwnedApplication(db, id, user);
  if (application.status !== 'DRAFT') {
    throw new AppError(409, 'INVALID_APPLICATION_STATE', 'Aplikasi sudah dikirim.', {
      status: application.status,
    });
  }
  const missing = missingEvidence(db, application);
  if (missing.length > 0) {
    throw new AppError(422, 'EVIDENCE_MISSING', 'Bukti kredensial belum lengkap.', {
      missingItems: missing,
    });
  }
  if (!findSelfAssessment(db, application.id)) {
    throw new AppError(422, 'SELF_ASSESSMENT_REQUIRED', 'Asesmen diri kesejahteraan wajib diisi.');
  }
  if (needsPackage(application) && packageCount(db, application) === 0) {
    throw new AppError(422, 'STOREFRONT_INCOMPLETE', 'Storefront butuh minimal satu paket.', {
      missingItems: ['packages'],
    });
  }

  const now = nowIso();
  const slaDueAt = addDays(now, config.applicationSlaDays);
  updateApplication(db, application.id, {
    status: 'PENDING_REVIEW',
    submitted_at: now,
    sla_due_at: slaDueAt,
    decided_at: null,
    decision_reason_code: null,
    decision_note: null,
    current_step: 'REVIEW',
    updated_at: now,
  });
  insertApplicationEvent(db, {
    id: newId('evo'),
    application_id: application.id,
    status: 'PENDING_REVIEW',
    actor_id: user.id,
    note: 'Aplikasi dikirim untuk verifikasi.',
    created_at: now,
  });
  syncMentorDraft(db, application.id);

  for (const adminId of listAdminIds(db)) {
    insertNotification(db, {
      id: newId('ntf'),
      user_id: adminId,
      type: 'APPLICATION_DECISION',
      payload_json: JSON.stringify({ applicationId: application.id, status: 'PENDING_REVIEW' }),
      read_at: null,
      created_at: now,
    });
  }

  return {
    id: application.id,
    status: 'PENDING_REVIEW',
    submittedAt: now,
    slaDueAt,
    missingItems: [],
  };
}

export function withdrawApplication(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const application = findOwnedApplication(db, id, user);
  if (application.status !== 'PENDING_REVIEW') {
    throw new AppError(409, 'INVALID_APPLICATION_STATE', 'Aplikasi tidak dapat ditarik.', {
      status: application.status,
    });
  }
  updateApplication(db, application.id, { status: 'WITHDRAWN', updated_at: nowIso() });
  insertApplicationEvent(db, {
    id: newId('evo'),
    application_id: application.id,
    status: 'WITHDRAWN',
    actor_id: user.id,
    note: 'Aplikasi ditarik oleh mentor.',
    created_at: nowIso(),
  });
  return { id: application.id, status: 'WITHDRAWN' };
}

// --- Approved storefront editing ------------------------------------------

export function getApprovedStorefront(db: Db, user: AuthUser): Record<string, unknown> {
  const mentor = findMentorByUserId(db, user.id);
  const approved = findApprovedApplication(db, user.id);
  if (!mentor || mentor.status !== 'APPROVED' || !approved) {
    throw new AppError(403, 'FORBIDDEN', 'Storefront belum dipublikasikan.');
  }
  const storefront = findStorefrontByMentor(db, user.id);
  if (!storefront) throw new AppError(404, 'NOT_FOUND', 'Storefront tidak ditemukan.');
  return serializeStorefrontView(db, storefront);
}

export function saveApprovedStorefront(
  db: Db,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const mentor = findMentorByUserId(db, user.id);
  if (!mentor || mentor.status !== 'APPROVED') {
    throw new AppError(403, 'FORBIDDEN', 'Storefront belum dipublikasikan.');
  }
  const input = readStorefrontInput(body);
  const row = applyStorefront(
    db,
    findStorefrontByMentor(db, user.id),
    { applicationId: null, mentorId: user.id },
    input,
  );
  updateMentor(db, user.id, {
    languages: row.languages_json,
    formats: row.formats_json,
    overseas_destinations_json: row.overseas_destinations_json,
  });
  return serializeStorefrontView(db, row);
}

function serializeStorefrontView(db: Db, row: StorefrontRow): Record<string, unknown> {
  const packages = listPackages(db, row.id);
  return {
    niche: row.niche,
    strengths: parseJson<string[]>(row.strengths_json, []),
    languages: parseJson<string[]>(row.languages_json, []),
    formats: parseJson<string[]>(row.formats_json, []),
    intro: row.intro,
    introVideoUrl: row.intro_video_url,
    wellBeingPhilosophy: row.well_being_philosophy,
    overseasDestinations: parseJson<string[]>(row.overseas_destinations_json, []),
    packages: packages.map((pkg) => ({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description,
      durationMinutes: pkg.duration_minutes,
      priceIdr: pkg.price_idr,
      isFreeConsultation: pkg.is_free_consultation === 1,
    })),
    published: row.published === 1,
  };
}

export function selfAssessmentRow(db: Db, applicationId: string): SelfAssessmentRow | undefined {
  return findSelfAssessment(db, applicationId);
}

export function evidenceRowValues(db: Db, applicationId: string): EvidenceRow[] {
  return listEvidence(db, applicationId);
}
