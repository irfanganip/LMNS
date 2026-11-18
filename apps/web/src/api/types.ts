/**
 * Wire types for docs/api-contract.md. Field names and nullability follow the
 * contract literally; no extra client-side shaping is allowed here.
 */

export type Role = 'MENTEE' | 'MENTOR' | 'ADMIN';
export type Tier = 'BASIC' | 'EDUCATOR_STANDARD' | 'EDUCATOR_PREMIUM';

export type Health = {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  database: { status: 'ok' | 'error'; seededAt: string | null; users: number; mentors: number };
};

export type RuntimeConfig = {
  platformFeeIdr: number;
  tierLabels: Record<string, string>;
  allowedEmailDomains: string[];
  demoMode: boolean;
  disclaimer: string;
};

export type User = {
  id: string;
  email: string;
  role: Role;
  emailVerifiedAt: string | null;
};

export type MenteeProfile = {
  userId: string;
  academicLevel: 'S1' | 'S2' | 'S3' | null;
  university: string | null;
  facultyMajor: string | null;
  semester: number | null;
  goals: string[];
  onboardingCompletedAt: string | null;
};

export type MentorBadgeType =
  'SISTER_VERIFIED' | 'SCOPUS_ORCID_VERIFIED' | 'LMNS_WELL_BEING_CERTIFIED';

export type Badge = { type: MentorBadgeType; label: string };

export type Rating = {
  academicGuidance: number;
  wellBeingSupport: number;
  reviewCount: number;
};

export type MentorCard = {
  id: string;
  slug: string;
  displayName: string;
  academicTitle: string | null;
  institution: string | null;
  discipline: string | null;
  tier: Tier;
  tierLabel: string;
  badges: Badge[];
  researchFocus: string[];
  languages: string[];
  formats: string[];
  overseasDestinations: string[];
  startingFeeIdr: number;
  freeConsultation: boolean;
  rating: Rating | null;
};

export type Package = {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  priceIdr: number;
  isFreeConsultation: boolean;
};

export type VerifiedLinks = {
  googleScholar: string | null;
  linkedin: string | null;
  scopus: string | null;
  orcid: string | null;
  institutional: string | null;
  sisterId: string | null;
};

export type MentorProfile = MentorCard & {
  intro: string | null;
  introVideoUrl: string | null;
  wellBeingPhilosophy: string | null;
  strengths: string[];
  verifiedLinks: VerifiedLinks | null;
  packages: Package[];
  reviews?: { aggregates: Rating; recent: ReviewPublic[] };
};

export type Storefront = {
  niche: string;
  strengths: string[];
  languages: string[];
  formats: string[];
  intro: string;
  introVideoUrl: string | null;
  wellBeingPhilosophy: string;
  packages: Package[];
  published: boolean;
};

export type ApplicationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN';

export type Application = {
  id: string;
  mentorId: string;
  displayName: string;
  tier: Tier;
  tierLabel: string;
  status: ApplicationStatus;
  currentStep: 'IDENTITY' | 'SELF_ASSESSMENT' | 'STORE_FRONT';
  submittedAt: string | null;
  slaDueAt: string | null;
  decidedAt: string | null;
  decisionReasonCode: string | null;
  decisionNote: string | null;
  evidence: Record<string, string | boolean | null>;
  missingItems: { key: string; label: string }[];
  selfAssessment: { philosophy: string; boundaries: string; burnoutApproach: string } | null;
  storefront: Storefront | null;
  history: { status: string; at: string; actorId: string }[];
};

export type AuditEvent = {
  id: string;
  entityType: string;
  entityId: string;
  actorId: string;
  action: string;
  reasonCode: string | null;
  note: string | null;
  createdAt: string;
};

export type BookingStatus =
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'REVIEWED'
  | 'CANCELLED';

export type IntakeNote = {
  topic: string;
  bottleneck: string;
  stressLevel: number | null;
};

export type Booking = {
  id: string;
  menteeId: string;
  mentorId: string;
  mentor: MentorCard;
  tier: Tier;
  tierLabel: string;
  sessionFeeBasis: 'RP_0' | 'AGREED_IN_MEDIATION' | 'PACKAGE_PRICE';
  status: BookingStatus;
  platformFeeIdr: number;
  paymentStatus: 'SUCCEEDED' | 'PENDING' | 'FAILED' | null;
  intakeNote: IntakeNote;
  createdAt: string;
  paidAt: string | null;
  scheduledAt: string | null;
  completedAt: string | null;
  reviewEligibleAt: string | null;
  threadId: string | null;
  alignment?: { confirmedItems?: number; totalItems?: number };
};

export type Payment = {
  id: string;
  bookingId: string;
  provider: 'QRIS' | 'VIRTUAL_ACCOUNT' | 'EWALLET';
  ewallet: string | null;
  amountIdr: number;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  failureCode: string | null;
  expiresAt: string;
  paidAt: string | null;
  instructions: { qrString: string | null; virtualAccount: string | null };
};

export type Receipt = {
  receiptNumber: string;
  issuedAt?: string;
  paidAt?: string;
  platformFeeIdr: number;
  sessionFeeBasis?: string;
  covers: string[];
  disclaimer?: string;
};

export type AlignmentItemValue = Record<string, string | number | null>;

export type AlignmentItem = {
  key: 'scope' | 'schedule' | 'fee';
  label: string;
  value: AlignmentItemValue;
  version: number;
  proposedBy: string;
  proposedAt: string;
  confirmations: { mentee: boolean; mentor: boolean };
  confirmed: boolean;
};

export type AlignmentCard = {
  bookingId: string;
  version: number;
  status: 'EMPTY' | 'PARTIAL' | 'CONFIRMED';
  items: AlignmentItem[];
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  senderRole: Role;
  body: string;
  createdAt: string;
};

export type Thread = {
  threadId: string;
  bookingId: string;
  openedAt: string;
  participants: { id: string; role: Role; displayName: string }[];
  contactPolicy: string;
  messages: Message[];
  alignment: AlignmentCard;
};

export type ReviewPublic = {
  id: string;
  academicGuidance: number;
  wellBeingSupport: number;
  comment: string | null;
  createdAt: string;
  menteeInitial: string;
};

export type ReviewEligibility = {
  eligible: boolean;
  reviewEligibleAt: string | null;
  reason: 'NOT_COMPLETED' | 'NOT_YET' | 'ELIGIBLE' | 'ALREADY_SUBMITTED';
  submitted: boolean;
  review: (ReviewPublic & { status?: 'PUBLISHED' | 'WITHHELD' }) | null;
};

export type AdminQueueItem = {
  application: Application;
  mentorEmail: string;
  slaAgeHours: number | null;
  flags: string[];
};

export type AdminApplicationDetail = AdminQueueItem & {
  domainCheck: { email: string; domain: string; allowed: boolean; institution: string | null };
  verifiedLinks: {
    sister: string | null;
    scopus: string | null;
    orcid: string | null;
    googleScholar: string | null;
    linkedin: string | null;
    institutional: string | null;
  };
  audit: AuditEvent[];
};

export type ReasonTemplate = { code: string; label: string; text: string };

export type UpgradeChecklistItem = {
  key: string;
  label: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REJECTED';
  detail: string | null;
};

export type UpgradeStatus = {
  currentTier: Tier;
  targetTier: Tier | null;
  eligible: boolean;
  checklist: UpgradeChecklistItem[];
  assessment: {
    score: number | null;
    passed: boolean;
    attemptsUsed: number;
    attemptsRemaining: number;
    retakeAvailableAt?: string | null;
  };
};

export type TrainingModule = {
  id: string;
  title: string;
  durationMinutes: number;
  completed: boolean;
};

export type TrainingModuleDetail = TrainingModule & { content: string; completedAt: string | null };

export type Certificate = {
  id: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
  fileName: string;
  issuer?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
  uploadedAt?: string;
};

export type MentorDashboard = {
  application: Application | null;
  mentor: MentorCard | null;
  upgrade: UpgradeStatus | null;
  stats: { upcomingBookings: number; pendingAgreements: number; completedSessions: number };
};

export type BookingOptions = {
  mentor: MentorCard;
  platformFeeIdr: number;
  platformFeeCovers: string[];
  sessionFeeBasis: 'RP_0' | 'AGREED_IN_MEDIATION' | 'PACKAGE_PRICE';
  sessionFeeNote: string;
  packages: Package[];
  comparison: {
    currentTier: Tier;
    premiumTier: Tier;
    rows: { perk: string; included: boolean; reason: string | null }[];
  };
};

export type Facet = { value: string; label: string; count: number };

export type Facets = {
  disciplines: Facet[];
  degreeFocus: Facet[];
  tiers: Facet[];
  destinations: Facet[];
  languages: Facet[];
  formats: Facet[];
};

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number };

export type MentorList = Page<MentorCard> & {
  appliedFilters: Record<string, string[]>;
  emptyResult: boolean;
};

export type Notification = {
  id: string;
  type: string;
  payload: Record<string, string>;
  readAt: string | null;
  createdAt: string;
};

export type AdminMentorRow = {
  mentor: MentorCard;
  badges: {
    id: string;
    type: MentorBadgeType;
    label: string;
    issuedAt: string;
    issuedBy: string;
    revokedAt: string | null;
    revokeReason: string | null;
  }[];
  status: string;
};

export type UpgradeAdminItem = {
  id: string;
  mentor: MentorCard;
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';
  checklist: UpgradeChecklistItem[];
  certificate: Certificate | null;
  submittedAt: string;
};
