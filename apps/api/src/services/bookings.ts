import type { Db } from '../db/index.js';
import { config } from '../config.js';
import { AppError } from '../http/errors.js';
import type { AuthUser } from '../http/auth.js';
import { asRecord, isIntInRange, requireString, validationError } from '../lib/validate.js';
import { addMinutes, newId, nowIso, readPagination } from '../lib/helpers.js';
import {
  findBooking,
  findOpenBooking,
  findThreadByBooking,
  insertAlignmentItem,
  insertBooking,
  insertPayment,
  insertThread,
  latestPayment,
  latestSucceededPayment,
  listBookings,
  nextReceiptSequence,
  updateBooking,
  updatePayment,
  type BookingRow,
  type PaymentRow,
  type ThreadRow,
} from '../repos/bookings.js';
import {
  findActiveBadge,
  findMentorBySlug,
  findMentorByUserId,
  findStorefrontByMentor,
  findPackage,
  listPackages,
  startingFee,
  type MentorRow,
  type PackageRow,
} from '../repos/mentors.js';
import { insertNotification } from '../repos/admin.js';
import {
  serializeBooking,
  serializeMentorCard,
  serializePackage,
  serializePayment,
} from '../serializers.js';
import { findUserByEmail, findUserById } from '../repos/identity.js';

const PAID_STATUSES = ['PAID', 'SCHEDULED', 'COMPLETED', 'REVIEWED'];
const CANCELLABLE = ['AWAITING_PAYMENT', 'PAYMENT_FAILED', 'PAID', 'SCHEDULED'];

const PERKS = [
  'Certified Mental Health & Academic Burnout Coaching',
  'Structured Post-Session Action & Well-Being Summary',
  'Priority Response SLA in Mediation Chat',
  'Curated Overseas/Doctoral Roadmap',
];

function listedMentorBySlug(db: Db, slug: string): MentorRow {
  const mentor = findMentorBySlug(db, slug);
  const user = mentor ? findUserById(db, mentor.user_id) : undefined;
  if (!mentor || mentor.status !== 'APPROVED' || !user || user.email_verified_at === null) {
    throw new AppError(
      404,
      'MENTOR_NOT_LISTED',
      'Mentor tidak ditemukan atau belum terverifikasi.',
    );
  }
  return mentor;
}

function mentorPackages(db: Db, mentorId: string): PackageRow[] {
  const storefront = findStorefrontByMentor(db, mentorId);
  return storefront ? listPackages(db, storefront.id) : [];
}

function feeBasis(packages: PackageRow[]): 'RP_0' | 'PACKAGE_PRICE' {
  const free = packages.some((pkg) => pkg.is_free_consultation === 1 || pkg.price_idr === 0);
  return free || packages.length === 0 ? 'RP_0' : 'PACKAGE_PRICE';
}

export function bookingOptions(db: Db, slug: string): Record<string, unknown> {
  const mentor = listedMentorBySlug(db, slug);
  const packages = mentorPackages(db, mentor.user_id);
  const basis = feeBasis(packages);
  const badge = findActiveBadge(db, mentor.user_id, 'LMNS_WELL_BEING_CERTIFIED');
  const premiumVerified = mentor.tier === 'EDUCATOR_PREMIUM' && badge !== undefined;

  return {
    mentor: serializeMentorCard(db, mentor),
    platformFeeIdr: config.platformFeeIdr,
    platformFeeCovers: config.platformFeeCovers,
    sessionFeeBasis: basis,
    sessionFeeNote:
      basis === 'RP_0'
        ? `Sesi ${config.tierLabels[mentor.tier]} ini gratis; biaya platform tetap berlaku.`
        : 'Biaya sesi disepakati di ruang mediasi; biaya platform tetap berlaku.',
    packages: packages.map(serializePackage),
    comparison: {
      currentTier: mentor.tier,
      premiumTier: 'EDUCATOR_PREMIUM',
      rows: PERKS.map((perk) => ({
        perk,
        included: premiumVerified,
        reason: premiumVerified ? null : 'Hanya untuk mentor Premium Educator',
      })),
    },
  };
}

function createInitialPayment(db: Db, booking: BookingRow, amountIdr: number): PaymentRow {
  const now = nowIso();
  const id = newId('pay');
  const payment: PaymentRow = {
    id,
    booking_id: booking.id,
    provider: 'QRIS',
    ewallet: null,
    amount_idr: amountIdr,
    status: 'PENDING',
    failure_code: null,
    idempotency_key: `idem_${id}`,
    instructions_json: JSON.stringify({ qrString: `DEMO-QRIS-${id}`, virtualAccount: null }),
    receipt_number: null,
    test_outcome: 'SUCCESS',
    created_at: now,
    expires_at: addMinutes(now, 30),
    paid_at: null,
  };
  insertPayment(db, payment);
  return payment;
}

export function createBooking(db: Db, user: AuthUser, body: unknown): Record<string, unknown> {
  const account = findUserByEmail(db, user.email);
  if (!account || account.email_verified_at === null) {
    throw new AppError(403, 'MENTEE_NOT_VERIFIED', 'Verifikasi email sebelum memesan sesi.', {
      email: user.email,
    });
  }

  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const mentorId = requireString(fields, input.mentorId, 'mentorId');
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const mentor = mentorId ? findMentorByUserId(db, mentorId) : undefined;
  const mentorUser = mentorId ? findUserById(db, mentorId) : undefined;
  if (
    !mentor ||
    mentor.status !== 'APPROVED' ||
    !mentorUser ||
    mentorUser.email_verified_at === null
  ) {
    throw new AppError(404, 'MENTOR_NOT_LISTED', 'Mentor tidak tersedia untuk dipesan.');
  }

  const intake = asRecord(input.intakeNote) ?? {};
  const topic = requireString(fields, intake.topic, 'intakeNote.topic', { min: 3, max: 200 });
  const bottleneck = requireString(fields, intake.bottleneck, 'intakeNote.bottleneck', {
    min: 3,
    max: 500,
  });
  if (!isIntInRange(intake.stressLevel, 1, 5)) {
    fields['intakeNote.stressLevel'] = 'Tingkat tekanan harus 1 sampai 5.';
  }
  const packageId =
    input.packageId === null || input.packageId === undefined ? null : input.packageId;
  if (packageId !== null && typeof packageId !== 'string') {
    fields.packageId = 'Paket tidak valid.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const packages = mentorPackages(db, mentor.user_id);
  if (typeof packageId === 'string') {
    const pkg = findPackage(db, packageId);
    if (!pkg || !packages.some((item) => item.id === pkg.id)) {
      throw validationError({ packageId: 'Paket tidak tersedia untuk mentor ini.' });
    }
  }

  const existing = findOpenBooking(db, user.id, mentor.user_id);
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'Masih ada pesanan terbuka dengan mentor ini.', {
      existingBookingId: existing.id,
    });
  }

  const now = nowIso();
  const booking: BookingRow = {
    id: newId('bkg'),
    mentee_id: user.id,
    mentor_id: mentor.user_id,
    package_id: typeof packageId === 'string' ? packageId : null,
    tier_snapshot: mentor.tier,
    session_fee_basis: feeBasis(packages),
    status: 'AWAITING_PAYMENT',
    platform_fee_idr: config.platformFeeIdr,
    intake_topic: topic as string,
    intake_bottleneck: bottleneck as string,
    intake_stress_level: intake.stressLevel as number,
    created_at: now,
    paid_at: null,
    scheduled_at: null,
    completed_at: null,
    cancelled_at: null,
    cancel_reason: null,
    review_eligible_at: null,
  };
  insertBooking(db, booking);
  const payment = createInitialPayment(db, booking, config.platformFeeIdr);
  return {
    booking: serializeBooking(db, booking, user),
    payment: serializePayment(payment),
  };
}

export function myBookings(
  db: Db,
  user: AuthUser,
  query: Record<string, unknown>,
): Record<string, unknown> {
  const { page, pageSize, offset } = readPagination(query);
  const requestedRole = typeof query.role === 'string' ? query.role : user.role.toLowerCase();
  const status = typeof query.status === 'string' && query.status !== '' ? query.status : undefined;
  const filter: {
    menteeId?: string;
    mentorId?: string;
    status?: string;
    limit: number;
    offset: number;
  } = { status, limit: pageSize, offset };
  if (requestedRole === 'mentor') {
    filter.mentorId = user.id;
  } else {
    filter.menteeId = user.id;
  }
  const { rows, total } = listBookings(db, filter);
  return {
    items: rows.map((row) => serializeBooking(db, row, user)),
    page,
    pageSize,
    total,
  };
}

export function participantBooking(db: Db, id: string, user: AuthUser): BookingRow {
  const booking = findBooking(db, id);
  if (!booking) throw new AppError(404, 'NOT_FOUND', 'Pesanan tidak ditemukan.');
  const participant = booking.mentee_id === user.id || booking.mentor_id === user.id;
  if (!participant && user.role !== 'ADMIN') {
    throw new AppError(403, 'FORBIDDEN', 'Anda bukan peserta pesanan ini.');
  }
  return booking;
}

export function getBooking(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  return serializeBooking(db, participantBooking(db, id, user), user);
}

function assertMenteeOwner(booking: BookingRow, user: AuthUser): void {
  if (booking.mentee_id !== user.id) {
    throw new AppError(403, 'FORBIDDEN', 'Hanya mentee pemilik pesanan yang dapat melakukan ini.');
  }
}

export function createPayment(
  db: Db,
  id: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const booking = participantBooking(db, id, user);
  assertMenteeOwner(booking, user);
  if (booking.status !== 'AWAITING_PAYMENT' && booking.status !== 'PAYMENT_FAILED') {
    throw new AppError(409, 'CONFLICT', 'Pesanan ini tidak dapat dibayar lagi.', {
      bookingStatus: booking.status,
    });
  }

  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const provider = requireString(fields, input.provider, 'provider');
  if (provider !== null && !['QRIS', 'VIRTUAL_ACCOUNT', 'EWALLET'].includes(provider)) {
    fields.provider = 'Metode pembayaran tidak dikenal.';
  }
  const ewallet = input.ewallet === null || input.ewallet === undefined ? null : input.ewallet;
  if (provider === 'EWALLET') {
    if (typeof ewallet !== 'string' || !['GOPAY', 'OVO', 'DANA'].includes(ewallet)) {
      fields.ewallet = 'Pilih GOPAY, OVO, atau DANA.';
    }
  } else if (ewallet !== null) {
    fields.ewallet = 'E-wallet hanya untuk metode EWALLET.';
  }
  const testOutcome = input.testOutcome === undefined ? 'SUCCESS' : input.testOutcome;
  if (testOutcome !== 'SUCCESS' && testOutcome !== 'FAILURE') {
    fields.testOutcome = 'Nilai uji harus SUCCESS atau FAILURE.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const now = nowIso();
  const paymentId = newId('pay');
  const instructions =
    provider === 'VIRTUAL_ACCOUNT'
      ? {
          qrString: null,
          virtualAccount: `8808${Math.floor(100000000 + Math.random() * 899999999)}`,
        }
      : provider === 'EWALLET'
        ? { qrString: null, virtualAccount: null, ewallet: ewallet as string }
        : { qrString: `DEMO-QRIS-${paymentId}`, virtualAccount: null };
  const payment: PaymentRow = {
    id: paymentId,
    booking_id: booking.id,
    provider: provider as PaymentRow['provider'],
    ewallet: ewallet as PaymentRow['ewallet'],
    amount_idr: booking.platform_fee_idr,
    status: 'PENDING',
    failure_code: null,
    idempotency_key: `idem_${paymentId}`,
    instructions_json: JSON.stringify(instructions),
    receipt_number: null,
    test_outcome: testOutcome as 'SUCCESS' | 'FAILURE',
    created_at: now,
    expires_at: addMinutes(now, 30),
    paid_at: null,
  };
  insertPayment(db, payment);
  return serializePayment(payment);
}

function receiptFor(payment: PaymentRow): Record<string, unknown> {
  return {
    receiptNumber: payment.receipt_number,
    paidAt: payment.paid_at,
    platformFeeIdr: payment.amount_idr,
    covers: config.platformFeeCovers,
  };
}

function openThread(db: Db, booking: BookingRow, now: string): ThreadRow {
  const existing = findThreadByBooking(db, booking.id);
  if (existing) return existing;
  const thread: ThreadRow = {
    id: newId('thr'),
    booking_id: booking.id,
    status: 'OPEN',
    opened_at: now,
    closed_at: null,
  };
  insertThread(db, thread);
  for (const key of ['scope', 'schedule', 'fee'] as const) {
    insertAlignmentItem(db, {
      id: newId('ali'),
      booking_id: booking.id,
      key,
      value_json: null,
      version: 0,
      proposed_by: null,
      proposed_at: null,
      confirmed: 0,
    });
  }
  return thread;
}

export function confirmPayment(
  db: Db,
  id: string,
  paymentId: string,
  user: AuthUser,
): Record<string, unknown> {
  const booking = participantBooking(db, id, user);
  assertMenteeOwner(booking, user);
  const payment = latestPayment(db, booking.id);
  if (!payment || payment.id !== paymentId) {
    throw new AppError(404, 'NOT_FOUND', 'Pembayaran tidak ditemukan.');
  }
  if (payment.booking_id !== booking.id) {
    throw new AppError(409, 'CONFLICT', 'Pembayaran milik pesanan lain.');
  }

  // Idempotent: a repeated confirmation returns the same settlement.
  if (payment.status === 'SUCCEEDED') {
    return {
      booking: serializeBooking(db, booking, user),
      payment: serializePayment(payment),
      receipt: receiptFor(payment),
    };
  }
  if (booking.status === 'CANCELLED') {
    throw new AppError(409, 'CONFLICT', 'Pesanan sudah dibatalkan.', {
      bookingStatus: booking.status,
    });
  }

  const now = nowIso();
  if (payment.test_outcome === 'FAILURE') {
    updatePayment(db, payment.id, { status: 'FAILED', failure_code: 'DEMO_FAILURE' });
    updateBooking(db, booking.id, { status: 'PAYMENT_FAILED' });
    const failed = findBooking(db, booking.id) as BookingRow;
    const failedPayment = latestPayment(db, booking.id) as PaymentRow;
    return {
      booking: serializeBooking(db, failed, user),
      payment: serializePayment(failedPayment),
      receipt: null,
    };
  }

  const year = new Date(now).getUTCFullYear();
  const receiptNumber = `LMNS-${year}-${String(nextReceiptSequence(db, year)).padStart(4, '0')}`;
  updatePayment(db, payment.id, {
    status: 'SUCCEEDED',
    paid_at: now,
    receipt_number: receiptNumber,
  });
  updateBooking(db, booking.id, { status: 'PAID', paid_at: booking.paid_at ?? now });
  openThread(db, booking, now);

  for (const userId of [booking.mentee_id, booking.mentor_id]) {
    insertNotification(db, {
      id: newId('ntf'),
      user_id: userId,
      type: 'BOOKING_PAID',
      payload_json: JSON.stringify({ bookingId: booking.id }),
      read_at: null,
      created_at: now,
    });
  }

  const paid = findBooking(db, booking.id) as BookingRow;
  const succeeded = latestPayment(db, booking.id) as PaymentRow;
  return {
    booking: serializeBooking(db, paid, user),
    payment: serializePayment(succeeded),
    receipt: receiptFor(succeeded),
  };
}

export function cancelBooking(
  db: Db,
  id: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const booking = participantBooking(db, id, user);
  if (!CANCELLABLE.includes(booking.status)) {
    throw new AppError(409, 'CONFLICT', 'Pesanan ini tidak dapat dibatalkan.', {
      bookingStatus: booking.status,
    });
  }
  const input = asRecord(body) ?? {};
  const reason =
    typeof input.reason === 'string' && input.reason.trim() !== ''
      ? input.reason.trim().slice(0, 300)
      : 'Dibatalkan oleh peserta.';
  const now = nowIso();
  updateBooking(db, booking.id, {
    status: 'CANCELLED',
    cancelled_at: now,
    cancel_reason: reason,
  });
  const thread = findThreadByBooking(db, booking.id);
  if (thread) {
    db.prepare("UPDATE mediation_threads SET status = 'CLOSED', closed_at = ? WHERE id = ?").run(
      now,
      thread.id,
    );
  }
  return {
    booking: serializeBooking(db, findBooking(db, booking.id) as BookingRow, user),
    refund: {
      platformFeeRefunded: false,
      note: 'Kebijakan refund di luar cakupan prototipe.',
    },
  };
}

export function receipt(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const booking = participantBooking(db, id, user);
  const payment = latestSucceededPayment(db, booking.id);
  if (!payment || !PAID_STATUSES.includes(booking.status)) {
    throw new AppError(402, 'PAYMENT_REQUIRED', 'Biaya platform belum dibayar.', {
      bookingId: booking.id,
      status: booking.status,
    });
  }
  return {
    receiptNumber: payment.receipt_number,
    issuedAt: payment.paid_at,
    platformFeeIdr: payment.amount_idr,
    sessionFeeBasis: booking.session_fee_basis,
    covers: config.platformFeeCovers,
    disclaimer: config.receiptDisclaimer,
  };
}

export function assertPaidThread(db: Db, id: string, user: AuthUser): BookingRow {
  const booking = participantBooking(db, id, user);
  if (!PAID_STATUSES.includes(booking.status)) {
    throw new AppError(
      402,
      'PAYMENT_REQUIRED',
      'Ruang mediasi terbuka setelah biaya platform dibayar.',
      {
        bookingId: booking.id,
        status: booking.status,
      },
    );
  }
  return booking;
}

export function startingFeeFor(db: Db, mentorId: string): number {
  return startingFee(mentorPackages(db, mentorId));
}
