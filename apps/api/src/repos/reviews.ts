import type { Db } from '../db/index.js';

export interface ReviewRow {
  id: string;
  booking_id: string;
  mentee_id: string;
  mentor_id: string;
  academic_guidance: number;
  well_being_support: number;
  comment: string | null;
  status: 'PUBLISHED' | 'WITHHELD';
  created_at: string;
}

export interface MoodRow {
  id: string;
  review_id: string | null;
  booking_id: string;
  mentee_id: string;
  stress_level: number;
  created_at: string;
}

export interface Aggregates {
  academicGuidance: number | null;
  wellBeingSupport: number | null;
  reviewCount: number;
}

export function insertReview(db: Db, row: ReviewRow): void {
  db.prepare(
    `INSERT INTO reviews
       (id, booking_id, mentee_id, mentor_id, academic_guidance, well_being_support, comment, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.booking_id,
    row.mentee_id,
    row.mentor_id,
    row.academic_guidance,
    row.well_being_support,
    row.comment,
    row.status,
    row.created_at,
  );
}

export function findReviewByBooking(db: Db, bookingId: string): ReviewRow | undefined {
  return db.prepare('SELECT * FROM reviews WHERE booking_id = ?').get(bookingId) as
    ReviewRow | undefined;
}

export function insertMood(db: Db, row: MoodRow): void {
  db.prepare(
    'INSERT INTO mood_checks (id, review_id, booking_id, mentee_id, stress_level, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(row.id, row.review_id, row.booking_id, row.mentee_id, row.stress_level, row.created_at);
}

export function aggregatesForMentor(db: Db, mentorId: string): Aggregates {
  const row = db
    .prepare(
      `SELECT
         AVG(CASE WHEN status = 'PUBLISHED' THEN academic_guidance END) AS academic,
         AVG(CASE WHEN status = 'PUBLISHED' THEN well_being_support END) AS well_being,
         COUNT(*) AS count
       FROM reviews WHERE mentor_id = ?`,
    )
    .get(mentorId) as { academic: number | null; well_being: number | null; count: number };
  return {
    academicGuidance: row.academic === null ? null : round(row.academic),
    wellBeingSupport: row.well_being === null ? null : round(row.well_being),
    reviewCount: row.count,
  };
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function listPublishedReviews(
  db: Db,
  mentorId: string,
  limit: number,
  offset: number,
): { rows: ReviewRow[]; total: number } {
  const rows = db
    .prepare(
      `SELECT * FROM reviews WHERE mentor_id = ? AND status = 'PUBLISHED'
        ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .all(mentorId, limit, offset) as unknown as ReviewRow[];
  const total = (
    db
      .prepare("SELECT COUNT(*) AS count FROM reviews WHERE mentor_id = ? AND status = 'PUBLISHED'")
      .get(mentorId) as { count: number }
  ).count;
  return { rows, total };
}

export function listReviewsByMentee(
  db: Db,
  menteeId: string,
  limit: number,
  offset: number,
): { rows: ReviewRow[]; total: number } {
  const rows = db
    .prepare(
      'SELECT * FROM reviews WHERE mentee_id = ? ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?',
    )
    .all(menteeId, limit, offset) as unknown as ReviewRow[];
  const total = (
    db.prepare('SELECT COUNT(*) AS count FROM reviews WHERE mentee_id = ?').get(menteeId) as {
      count: number;
    }
  ).count;
  return { rows, total };
}
