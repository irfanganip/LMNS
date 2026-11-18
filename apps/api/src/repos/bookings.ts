import type { Db } from '../db/index.js';

export type BookingStatus =
  | 'AWAITING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PAID'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'REVIEWED'
  | 'CANCELLED';

export interface BookingRow {
  id: string;
  mentee_id: string;
  mentor_id: string;
  package_id: string | null;
  tier_snapshot: string;
  session_fee_basis: string;
  status: BookingStatus;
  platform_fee_idr: number;
  intake_topic: string;
  intake_bottleneck: string;
  intake_stress_level: number | null;
  created_at: string;
  paid_at: string | null;
  scheduled_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  review_eligible_at: string | null;
}

export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED';

export interface PaymentRow {
  id: string;
  booking_id: string;
  provider: 'QRIS' | 'VIRTUAL_ACCOUNT' | 'EWALLET';
  ewallet: 'GOPAY' | 'OVO' | 'DANA' | null;
  amount_idr: number;
  status: PaymentStatus;
  failure_code: string | null;
  idempotency_key: string;
  instructions_json: string;
  receipt_number: string | null;
  test_outcome: 'SUCCESS' | 'FAILURE';
  created_at: string;
  expires_at: string;
  paid_at: string | null;
}

export interface ThreadRow {
  id: string;
  booking_id: string;
  status: 'OPEN' | 'CLOSED';
  opened_at: string;
  closed_at: string | null;
}

export interface MessageRow {
  id: string;
  thread_id: string;
  sender_id: string;
  sender_role: string;
  body: string;
  created_at: string;
}

export interface AlignmentItemRow {
  id: string;
  booking_id: string;
  key: 'scope' | 'schedule' | 'fee';
  value_json: string | null;
  version: number;
  proposed_by: string | null;
  proposed_at: string | null;
  confirmed: number;
}

export interface ConfirmationRow {
  item_id: string;
  user_id: string;
  item_version: number;
  confirmed_at: string;
}

// --- Bookings --------------------------------------------------------------

export function insertBooking(db: Db, row: BookingRow): void {
  db.prepare(
    `INSERT INTO bookings
       (id, mentee_id, mentor_id, package_id, tier_snapshot, session_fee_basis, status, platform_fee_idr,
        intake_topic, intake_bottleneck, intake_stress_level, created_at, paid_at, scheduled_at,
        completed_at, cancelled_at, cancel_reason, review_eligible_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.mentee_id,
    row.mentor_id,
    row.package_id,
    row.tier_snapshot,
    row.session_fee_basis,
    row.status,
    row.platform_fee_idr,
    row.intake_topic,
    row.intake_bottleneck,
    row.intake_stress_level,
    row.created_at,
    row.paid_at,
    row.scheduled_at,
    row.completed_at,
    row.cancelled_at,
    row.cancel_reason,
    row.review_eligible_at,
  );
}

export function findBooking(db: Db, id: string): BookingRow | undefined {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id) as BookingRow | undefined;
}

export function updateBooking(db: Db, id: string, patch: Partial<BookingRow>): void {
  const keys = Object.keys(patch) as (keyof BookingRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE bookings SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | number | null)[]),
    id,
  );
}

export interface BookingFilter {
  menteeId?: string;
  mentorId?: string;
  status?: string;
  limit: number;
  offset: number;
}

export function listBookings(
  db: Db,
  filter: BookingFilter,
): {
  rows: BookingRow[];
  total: number;
} {
  const where: string[] = [];
  const params: string[] = [];
  if (filter.menteeId) {
    where.push('mentee_id = ?');
    params.push(filter.menteeId);
  }
  if (filter.mentorId) {
    where.push('mentor_id = ?');
    params.push(filter.mentorId);
  }
  if (filter.status) {
    where.push('status = ?');
    params.push(filter.status);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(`SELECT * FROM bookings ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
    .all(...params, filter.limit, filter.offset) as unknown as BookingRow[];
  const total = (
    db.prepare(`SELECT COUNT(*) AS count FROM bookings ${clause}`).get(...params) as {
      count: number;
    }
  ).count;
  return { rows, total };
}

export function findOpenBooking(
  db: Db,
  menteeId: string,
  mentorId: string,
): BookingRow | undefined {
  return db
    .prepare(
      `SELECT * FROM bookings
        WHERE mentee_id = ? AND mentor_id = ?
          AND status IN ('AWAITING_PAYMENT','PAYMENT_FAILED','PAID','SCHEDULED')
        ORDER BY created_at DESC LIMIT 1`,
    )
    .get(menteeId, mentorId) as BookingRow | undefined;
}

export function countBookingsForMentor(db: Db, mentorId: string, statuses: string[]): number {
  const placeholders = statuses.map(() => '?').join(', ');
  return (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM bookings WHERE mentor_id = ? AND status IN (${placeholders})`,
      )
      .get(mentorId, ...statuses) as { count: number }
  ).count;
}

export function countBookingsForMentee(db: Db, menteeId: string, statuses: string[]): number {
  const placeholders = statuses.map(() => '?').join(', ');
  return (
    db
      .prepare(
        `SELECT COUNT(*) AS count FROM bookings WHERE mentee_id = ? AND status IN (${placeholders})`,
      )
      .get(menteeId, ...statuses) as { count: number }
  ).count;
}

// --- Payments --------------------------------------------------------------

export function insertPayment(db: Db, row: PaymentRow): void {
  db.prepare(
    `INSERT INTO payments
       (id, booking_id, provider, ewallet, amount_idr, status, failure_code, idempotency_key,
        instructions_json, receipt_number, test_outcome, created_at, expires_at, paid_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.booking_id,
    row.provider,
    row.ewallet,
    row.amount_idr,
    row.status,
    row.failure_code,
    row.idempotency_key,
    row.instructions_json,
    row.receipt_number,
    row.test_outcome,
    row.created_at,
    row.expires_at,
    row.paid_at,
  );
}

export function findPayment(db: Db, id: string): PaymentRow | undefined {
  return db.prepare('SELECT * FROM payments WHERE id = ?').get(id) as PaymentRow | undefined;
}

export function updatePayment(db: Db, id: string, patch: Partial<PaymentRow>): void {
  const keys = Object.keys(patch) as (keyof PaymentRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE payments SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | number | null)[]),
    id,
  );
}

export function latestPayment(db: Db, bookingId: string): PaymentRow | undefined {
  return db
    .prepare(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY created_at DESC, id DESC LIMIT 1',
    )
    .get(bookingId) as PaymentRow | undefined;
}

export function latestSucceededPayment(db: Db, bookingId: string): PaymentRow | undefined {
  return db
    .prepare(
      "SELECT * FROM payments WHERE booking_id = ? AND status = 'SUCCEEDED' ORDER BY paid_at DESC LIMIT 1",
    )
    .get(bookingId) as PaymentRow | undefined;
}

export function nextReceiptSequence(db: Db, year: number): number {
  const prefix = `LMNS-${year}-`;
  const row = db
    .prepare('SELECT COUNT(*) AS count FROM payments WHERE receipt_number LIKE ?')
    .get(`${prefix}%`) as { count: number };
  return row.count + 1;
}

// --- Mediation -------------------------------------------------------------

export function insertThread(db: Db, row: ThreadRow): void {
  db.prepare(
    'INSERT INTO mediation_threads (id, booking_id, status, opened_at, closed_at) VALUES (?, ?, ?, ?, ?)',
  ).run(row.id, row.booking_id, row.status, row.opened_at, row.closed_at);
}

export function findThreadByBooking(db: Db, bookingId: string): ThreadRow | undefined {
  return db.prepare('SELECT * FROM mediation_threads WHERE booking_id = ?').get(bookingId) as
    ThreadRow | undefined;
}

export function updateThread(db: Db, id: string, patch: Partial<ThreadRow>): void {
  const keys = Object.keys(patch) as (keyof ThreadRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE mediation_threads SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | null)[]),
    id,
  );
}

export function insertMessage(db: Db, row: MessageRow): void {
  db.prepare(
    'INSERT INTO mediation_messages (id, thread_id, sender_id, sender_role, body, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(row.id, row.thread_id, row.sender_id, row.sender_role, row.body, row.created_at);
}

export function listMessages(db: Db, threadId: string): MessageRow[] {
  return db
    .prepare('SELECT * FROM mediation_messages WHERE thread_id = ? ORDER BY created_at, id')
    .all(threadId) as unknown as MessageRow[];
}

// --- Alignment -------------------------------------------------------------

export function insertAlignmentItem(db: Db, row: AlignmentItemRow): void {
  db.prepare(
    `INSERT INTO alignment_items (id, booking_id, key, value_json, version, proposed_by, proposed_at, confirmed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.booking_id,
    row.key,
    row.value_json,
    row.version,
    row.proposed_by,
    row.proposed_at,
    row.confirmed,
  );
}

export function listAlignmentItems(db: Db, bookingId: string): AlignmentItemRow[] {
  return db
    .prepare(
      `SELECT * FROM alignment_items WHERE booking_id = ?
        ORDER BY CASE key WHEN 'scope' THEN 0 WHEN 'schedule' THEN 1 ELSE 2 END`,
    )
    .all(bookingId) as unknown as AlignmentItemRow[];
}

export function findAlignmentItem(
  db: Db,
  bookingId: string,
  key: string,
): AlignmentItemRow | undefined {
  return db
    .prepare('SELECT * FROM alignment_items WHERE booking_id = ? AND key = ?')
    .get(bookingId, key) as AlignmentItemRow | undefined;
}

export function updateAlignmentItem(db: Db, id: string, patch: Partial<AlignmentItemRow>): void {
  const keys = Object.keys(patch) as (keyof AlignmentItemRow)[];
  if (keys.length === 0) return;
  const assignments = keys.map((key) => `${key} = ?`).join(', ');
  db.prepare(`UPDATE alignment_items SET ${assignments} WHERE id = ?`).run(
    ...(keys.map((key) => patch[key]) as (string | number | null)[]),
    id,
  );
}

export function listConfirmations(db: Db, itemId: string): ConfirmationRow[] {
  return db
    .prepare('SELECT * FROM alignment_item_confirmations WHERE item_id = ?')
    .all(itemId) as unknown as ConfirmationRow[];
}

export function upsertConfirmation(db: Db, row: ConfirmationRow): void {
  db.prepare(
    `INSERT INTO alignment_item_confirmations (item_id, user_id, item_version, confirmed_at)
     VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`,
  ).run(row.item_id, row.user_id, row.item_version, row.confirmed_at);
}
