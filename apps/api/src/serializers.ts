import type { Db } from './db/index.js';
import { config } from './config.js';
import { parseJson } from './lib/helpers.js';
import {
  buildStorefront,
  findStorefrontByMentor,
  findMentorByUserId,
  listActiveBadges,
  listPackages,
  startingFee,
  type ApplicationRow,
  type BadgeRow,
  type MentorRow,
  type PackageRow,
  type StorefrontRow,
} from './repos/mentors.js';
import { aggregatesForMentor, type ReviewRow } from './repos/reviews.js';
import {
  findThreadByBooking,
  latestPayment,
  type AlignmentItemRow,
  type BookingRow,
  type PaymentRow,
} from './repos/bookings.js';
import type { MenteeProfileRow, PulseRow, UserRow } from './repos/identity.js';
import type { AuditRow, NotificationRow } from './repos/admin.js';

export const BADGE_LABELS: Record<string, string> = {
  SISTER_VERIFIED: 'SISTER Verified',
  SCOPUS_ORCID_VERIFIED: 'Scopus/ORCID Verified',
  LMNS_WELL_BEING_CERTIFIED: 'LMNS Well-Being Certified',
};

export function serializeUser(row: UserRow): Record<string, unknown> {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    emailVerifiedAt: row.email_verified_at,
  };
}

export function serializeMenteeProfile(row: MenteeProfileRow): Record<string, unknown> {
  return {
    userId: row.user_id,
    academicLevel: row.academic_level,
    university: row.university,
    facultyMajor: row.faculty_major,
    semester: row.semester,
    goals: parseJson<string[]>(row.goals_json, []),
    onboardingCompletedAt: row.onboarding_completed_at,
  };
}

export function serializePulse(row: PulseRow): Record<string, unknown> {
  return {
    id: row.id,
    answers: parseJson<Record<string, unknown>>(row.answers, {}),
    skipped: row.skipped === 1,
    createdAt: row.created_at,
  };
}

export function serializePackage(row: PackageRow): Record<string, unknown> {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    durationMinutes: row.duration_minutes,
    priceIdr: row.price_idr,
    isFreeConsultation: row.is_free_consultation === 1,
  };
}

export function serializeBadge(row: BadgeRow): Record<string, unknown> {
  return {
    id: row.id,
    type: row.type,
    label: BADGE_LABELS[row.type] ?? row.type,
    issuedAt: row.issued_at,
    issuedBy: row.issued_by,
    revokedAt: row.revoked_at,
    revokeReason: row.revoke_reason,
  };
}

export function packagesFor(db: Db, mentorId: string): PackageRow[] {
  const storefront = findStorefrontByMentor(db, mentorId);
  return storefront ? listPackages(db, storefront.id) : [];
}

export function serializeMentorCard(db: Db, mentor: MentorRow): Record<string, unknown> {
  const packages = packagesFor(db, mentor.user_id);
  const aggregates = aggregatesForMentor(db, mentor.user_id);
  return {
    id: mentor.user_id,
    slug: mentor.slug,
    displayName: mentor.display_name,
    academicTitle: mentor.academic_title,
    institution: mentor.institution,
    discipline: mentor.discipline,
    tier: mentor.tier,
    tierLabel: config.tierLabels[mentor.tier],
    badges: listActiveBadges(db, mentor.user_id).map((badge) => ({
      type: badge.type,
      label: BADGE_LABELS[badge.type] ?? badge.type,
    })),
    researchFocus: parseJson<string[]>(mentor.research_focus_json, []),
    languages: parseJson<string[]>(mentor.languages, []),
    formats: parseJson<string[]>(mentor.formats, []),
    overseasDestinations: parseJson<string[]>(mentor.overseas_destinations_json, []),
    startingFeeIdr: startingFee(packages),
    freeConsultation: packages.some((pkg) => pkg.is_free_consultation === 1 || pkg.price_idr === 0),
    rating: aggregates,
  };
}

export function serializeMentorCardById(db: Db, mentorId: string): Record<string, unknown> | null {
  const mentor = findMentorByUserId(db, mentorId);
  return mentor ? serializeMentorCard(db, mentor) : null;
}

export function serializeStorefront(db: Db, row: StorefrontRow): Record<string, unknown> {
  const storefront = buildStorefront(row);
  const packages = listPackages(db, row.id);
  return {
    niche: storefront.niche,
    strengths: storefront.strengths,
    languages: storefront.languages,
    formats: storefront.formats,
    intro: storefront.intro,
    introVideoUrl: storefront.introVideoUrl,
    wellBeingPhilosophy: storefront.wellBeingPhilosophy,
    overseasDestinations: storefront.overseasDestinations,
    packages: packages.map(serializePackage),
    published: storefront.published,
  };
}

export function serializeMentorProfile(db: Db, mentor: MentorRow): Record<string, unknown> {
  const card = serializeMentorCard(db, mentor);
  const storefrontRow = findStorefrontByMentor(db, mentor.user_id);
  const storefront = storefrontRow ? buildStorefront(storefrontRow) : null;
  return {
    ...card,
    intro: storefront?.intro ?? null,
    introVideoUrl: storefront?.introVideoUrl ?? null,
    wellBeingPhilosophy: storefront?.wellBeingPhilosophy ?? null,
    strengths: storefront?.strengths ?? [],
    verifiedLinks: parseJson<Record<string, string | null>>(mentor.verified_links_json, {}),
    packages: packagesFor(db, mentor.user_id).map(serializePackage),
  };
}

export function serializeReviewPublic(
  row: ReviewRow,
  menteeInitial: string,
): Record<string, unknown> {
  return {
    id: row.id,
    academicGuidance: row.academic_guidance,
    wellBeingSupport: row.well_being_support,
    comment: row.status === 'PUBLISHED' ? row.comment : null,
    createdAt: row.created_at,
    menteeInitial,
  };
}

export function serializeApplication(
  db: Db,
  application: ApplicationRow,
  extras: {
    evidence: { key: string; value: string }[];
    missingItems: { key: string; label: string }[];
    storefront: StorefrontRow | null;
    selfAssessment: { philosophy: string; boundaries: string; burnoutApproach: string } | null;
    history: { status: string; at: string; actorId: string }[];
  },
): Record<string, unknown> {
  return {
    id: application.id,
    mentorId: application.mentor_id,
    tier: application.tier,
    tierLabel: config.tierLabels[application.tier],
    status: application.status,
    currentStep: application.current_step,
    submittedAt: application.submitted_at,
    slaDueAt: application.sla_due_at,
    decidedAt: application.decided_at,
    decisionReasonCode: application.decision_reason_code,
    decisionNote: application.decision_note,
    displayName: application.display_name,
    academicTitle: application.academic_title,
    institution: application.institution,
    discipline: application.discipline,
    evidence: Object.fromEntries(extras.evidence.map((row) => [row.key, row.value])),
    missingItems: extras.missingItems,
    selfAssessment: extras.selfAssessment,
    storefront: extras.storefront ? serializeStorefront(db, extras.storefront) : null,
    history: extras.history,
  };
}

export function serializeBooking(
  db: Db,
  booking: BookingRow,
  viewer: { id: string; role: string },
): Record<string, unknown> {
  const payment = latestPayment(db, booking.id);
  const thread = findThreadByBooking(db, booking.id);
  const intakeNote: Record<string, unknown> = {
    topic: booking.intake_topic,
    bottleneck: booking.intake_bottleneck,
  };
  // G6: stress level is visible to the owning mentee only.
  if (viewer.role === 'MENTEE' && viewer.id === booking.mentee_id) {
    intakeNote.stressLevel = booking.intake_stress_level;
  }
  return {
    id: booking.id,
    menteeId: booking.mentee_id,
    mentorId: booking.mentor_id,
    mentor: serializeMentorCardById(db, booking.mentor_id),
    tier: booking.tier_snapshot,
    tierLabel: config.tierLabels[booking.tier_snapshot as keyof typeof config.tierLabels],
    sessionFeeBasis: booking.session_fee_basis,
    status: booking.status,
    platformFeeIdr: booking.platform_fee_idr,
    paymentStatus: payment?.status ?? null,
    intakeNote,
    createdAt: booking.created_at,
    paidAt: booking.paid_at,
    scheduledAt: booking.scheduled_at,
    completedAt: booking.completed_at,
    reviewEligibleAt: booking.review_eligible_at,
    threadId: thread?.id ?? null,
  };
}

export function serializePayment(row: PaymentRow): Record<string, unknown> {
  const instructions = parseJson<Record<string, unknown>>(row.instructions_json, {});
  return {
    id: row.id,
    bookingId: row.booking_id,
    provider: row.provider,
    ewallet: row.ewallet,
    amountIdr: row.amount_idr,
    status: row.status,
    failureCode: row.failure_code,
    expiresAt: row.expires_at,
    paidAt: row.paid_at,
    receiptNumber: row.receipt_number,
    instructions,
  };
}

export function serializeAlignment(
  db: Db,
  bookingId: string,
  items: AlignmentItemRow[],
  confirmations: Map<string, { mentee: boolean; mentor: boolean }>,
): Record<string, unknown> {
  const threads = findThreadByBooking(db, bookingId);
  void threads;
  const serialized = items.map((item) => {
    const confirmed = confirmations.get(item.id) ?? { mentee: false, mentor: false };
    return {
      key: item.key,
      label: ALIGNMENT_LABELS[item.key],
      value: parseJson<Record<string, unknown> | null>(item.value_json, null),
      version: item.version,
      proposedBy: item.proposed_by,
      proposedAt: item.proposed_at,
      confirmations: { mentee: confirmed.mentee, mentor: confirmed.mentor },
      confirmed: item.value_json !== null && confirmed.mentee && confirmed.mentor,
    };
  });
  const allItemsConfirmed = serialized.length === 3 && serialized.every((item) => item.confirmed);
  const anyProposed = serialized.some((item) => item.value !== null);
  const anyConfirmed = serialized.some(
    (item) => item.confirmations.mentee || item.confirmations.mentor,
  );
  const status = allItemsConfirmed
    ? 'CONFIRMED'
    : anyProposed || anyConfirmed
      ? 'PARTIAL'
      : 'EMPTY';
  const version = items.reduce((max, item) => Math.max(max, item.version), 0);
  return {
    bookingId,
    version,
    status,
    items: serialized,
    allItemsConfirmed,
  };
}

const ALIGNMENT_LABELS: Record<string, string> = {
  scope: 'Ruang lingkup & hasil akademik',
  schedule: 'Jadwal & tautan sesi',
  fee: 'Biaya sesi & metode pembayaran',
};

export function serializeNotification(row: NotificationRow): Record<string, unknown> {
  return {
    id: row.id,
    type: row.type,
    payload: parseJson<Record<string, unknown>>(row.payload_json, {}),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function serializeAudit(row: AuditRow): Record<string, unknown> {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    actorId: row.actor_id,
    action: row.action,
    reasonCode: row.reason_code,
    note: row.note,
    createdAt: row.created_at,
  };
}

/** "Rani" → "R." — public reviews never expose the mentee's identity. */
export function initialOf(name: string): string {
  const trimmed = name.trim();
  return trimmed === '' ? '?' : `${trimmed[0]?.toUpperCase() ?? '?'}.`;
}

export function displayNameForUser(db: Db, userId: string): string {
  const mentee = db.prepare('SELECT user_id FROM mentee_profiles WHERE user_id = ?').get(userId) as
    { user_id: string } | undefined;
  if (mentee) {
    const email = db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as
      { email: string } | undefined;
    const local = email?.email.split('@')[0] ?? userId;
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  const mentor = findMentorByUserId(db, userId);
  if (mentor) return mentor.display_name;
  return userId;
}
