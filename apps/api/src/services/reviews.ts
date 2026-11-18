import type { Db } from '../db/index.js';
import { AppError } from '../http/errors.js';
import type { AuthUser } from '../http/auth.js';
import { asRecord, isIntInRange, validationError } from '../lib/validate.js';
import { newId, nowIso, readPagination } from '../lib/helpers.js';
import {
  findReviewByBooking,
  insertMood,
  insertReview,
  listReviewsByMentee,
  type ReviewRow,
} from '../repos/reviews.js';
import { findBooking, updateBooking, type BookingRow } from '../repos/bookings.js';
import { serializeMentorCardById, serializeReviewPublic } from '../serializers.js';

function ownedMenteeBooking(db: Db, id: string, user: AuthUser): BookingRow {
  const booking = findBooking(db, id);
  if (!booking || booking.mentee_id !== user.id) {
    throw new AppError(404, 'NOT_FOUND', 'Pesanan tidak ditemukan.');
  }
  return booking;
}

export function reviewState(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const booking = ownedMenteeBooking(db, id, user);
  const existing = findReviewByBooking(db, booking.id);
  const eligibleAt = booking.review_eligible_at;

  if (existing) {
    return {
      eligible: false,
      reviewEligibleAt: eligibleAt,
      reason: 'ALREADY_SUBMITTED',
      submitted: true,
      review: serializeReviewPublic(existing, ''),
    };
  }
  if (booking.status !== 'COMPLETED' && booking.status !== 'REVIEWED') {
    return {
      eligible: false,
      reviewEligibleAt: eligibleAt,
      reason: 'NOT_COMPLETED',
      submitted: false,
      review: null,
    };
  }
  if (eligibleAt !== null && Date.parse(eligibleAt) > Date.now()) {
    return {
      eligible: false,
      reviewEligibleAt: eligibleAt,
      reason: 'NOT_YET',
      submitted: false,
      review: null,
    };
  }
  return {
    eligible: true,
    reviewEligibleAt: eligibleAt,
    reason: 'ELIGIBLE',
    submitted: false,
    review: null,
  };
}

/** Public reviews withhold the mentee's identity; the author sees their own text. */
export function myReviews(
  db: Db,
  user: AuthUser,
  query: Record<string, unknown>,
): Record<string, unknown> {
  const { page, pageSize, offset } = readPagination(query);
  const { rows, total } = listReviewsByMentee(db, user.id, pageSize, offset);
  return {
    items: rows.map((row) => ({
      review: {
        id: row.id,
        academicGuidance: row.academic_guidance,
        wellBeingSupport: row.well_being_support,
        comment: row.comment,
        status: row.status,
        createdAt: row.created_at,
      },
      bookingId: row.booking_id,
      mentor: serializeMentorCardById(db, row.mentor_id),
    })),
    page,
    pageSize,
    total,
  };
}

export function submitReview(
  db: Db,
  id: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const booking = ownedMenteeBooking(db, id, user);
  if (findReviewByBooking(db, booking.id)) {
    throw new AppError(409, 'REVIEW_ALREADY_SUBMITTED', 'Ulasan untuk sesi ini sudah dikirim.');
  }
  const eligibleAt = booking.review_eligible_at;
  if (
    (booking.status !== 'COMPLETED' && booking.status !== 'REVIEWED') ||
    (eligibleAt !== null && Date.parse(eligibleAt) > Date.now())
  ) {
    throw new AppError(409, 'REVIEW_NOT_ELIGIBLE', 'Ulasan belum dapat dikirim.', {
      reviewEligibleAt: eligibleAt,
      bookingStatus: booking.status,
    });
  }

  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  if (!isIntInRange(input.academicGuidance, 1, 5)) {
    fields.academicGuidance = 'Nilai 1 sampai 5.';
  }
  if (!isIntInRange(input.wellBeingSupport, 1, 5)) {
    fields.wellBeingSupport = 'Nilai 1 sampai 5.';
  }
  const comment = input.comment === null || input.comment === undefined ? null : input.comment;
  if (typeof comment === 'string' && comment.length > 1000) {
    fields.comment = 'Komentar maksimal 1000 karakter.';
  } else if (comment !== null && typeof comment !== 'string') {
    fields.comment = 'Komentar harus teks.';
  }
  const moodCheck = input.moodCheck === undefined ? null : asRecord(input.moodCheck);
  if (input.moodCheck !== undefined && moodCheck === null) {
    fields.moodCheck = 'Format mood check tidak valid.';
  }
  if (moodCheck && !isIntInRange(moodCheck.stressLevel, 1, 5)) {
    fields['moodCheck.stressLevel'] = 'Nilai 1 sampai 5.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const now = nowIso();
  const review: ReviewRow = {
    id: newId('rev'),
    booking_id: booking.id,
    mentee_id: user.id,
    mentor_id: booking.mentor_id,
    academic_guidance: input.academicGuidance as number,
    well_being_support: input.wellBeingSupport as number,
    comment: typeof comment === 'string' && comment.trim() !== '' ? comment.trim() : null,
    status: 'PUBLISHED',
    created_at: now,
  };
  insertReview(db, review);

  let moodRecorded = false;
  if (moodCheck) {
    insertMood(db, {
      id: newId('mod'),
      review_id: review.id,
      mentee_id: user.id,
      booking_id: booking.id,
      stress_level: moodCheck.stressLevel as number,
      created_at: now,
    });
    moodRecorded = true;
  }
  updateBooking(db, booking.id, { status: 'REVIEWED' });

  return {
    review: {
      id: review.id,
      academicGuidance: review.academic_guidance,
      wellBeingSupport: review.well_being_support,
      comment: review.comment,
      status: review.status,
      createdAt: review.created_at,
    },
    bookingStatus: 'REVIEWED',
    moodRecorded,
  };
}
