import type { Db } from '../db/index.js';
import { config } from '../config.js';
import { AppError } from '../http/errors.js';
import type { AuthUser } from '../http/auth.js';
import {
  asRecord,
  isHttpUrl,
  isIntInRange,
  requireString,
  validationError,
} from '../lib/validate.js';
import { addMinutes, newId, nowIso } from '../lib/helpers.js';
import {
  findAlignmentItem,
  findThreadByBooking,
  insertMessage,
  listAlignmentItems,
  listConfirmations,
  listMessages,
  updateAlignmentItem,
  updateBooking,
  upsertConfirmation,
  type AlignmentItemRow,
  type BookingRow,
} from '../repos/bookings.js';
import { findUserById } from '../repos/identity.js';
import { displayNameForUser, serializeAlignment, serializeBooking } from '../serializers.js';
import { assertPaidThread } from './bookings.js';

const ITEM_KEYS = ['scope', 'schedule', 'fee'] as const;
type ItemKey = (typeof ITEM_KEYS)[number];

/** Only the current version's confirmations count; an edit clears them. */
function confirmationMap(
  db: Db,
  items: AlignmentItemRow[],
): Map<string, { mentee: boolean; mentor: boolean }> {
  const map = new Map<string, { mentee: boolean; mentor: boolean }>();
  for (const item of items) {
    const entry = { mentee: false, mentor: false };
    for (const row of listConfirmations(db, item.id)) {
      if (row.item_version !== item.version) continue;
      const user = findUserById(db, row.user_id);
      if (user?.role === 'MENTEE') entry.mentee = true;
      if (user?.role === 'MENTOR') entry.mentor = true;
    }
    map.set(item.id, entry);
  }
  return map;
}

function alignmentCard(db: Db, bookingId: string): Record<string, unknown> {
  const items = listAlignmentItems(db, bookingId);
  return serializeAlignment(db, bookingId, items, confirmationMap(db, items));
}

function lockItem(itemKey: string): ItemKey {
  if (!ITEM_KEYS.includes(itemKey as ItemKey)) {
    throw new AppError(404, 'NOT_FOUND', 'Item kesepakatan tidak dikenal.');
  }
  return itemKey as ItemKey;
}

function writableThread(db: Db, booking: BookingRow): { id: string; status: string } {
  const thread = findThreadByBooking(db, booking.id);
  if (!thread) throw new AppError(404, 'NOT_FOUND', 'Ruang mediasi belum terbuka.');
  if (thread.status === 'CLOSED') {
    throw new AppError(409, 'THREAD_CLOSED', 'Ruang mediasi sudah ditutup.');
  }
  return thread;
}

export function thread(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const booking = assertPaidThread(db, id, user);
  const row = findThreadByBooking(db, booking.id);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Ruang mediasi belum terbuka.');
  return {
    threadId: row.id,
    bookingId: booking.id,
    openedAt: row.opened_at,
    status: row.status,
    participants: [booking.mentee_id, booking.mentor_id].map((participantId) => {
      const participant = findUserById(db, participantId);
      return {
        id: participantId,
        role: participant?.role ?? 'MENTEE',
        displayName: displayNameForUser(db, participantId),
      };
    }),
    contactPolicy: config.contactPolicy,
    messages: listMessages(db, row.id).map((message) => ({
      id: message.id,
      threadId: message.thread_id,
      senderId: message.sender_id,
      senderRole: message.sender_role,
      body: message.body,
      createdAt: message.created_at,
    })),
    alignment: alignmentCard(db, booking.id),
  };
}

export function postMessage(
  db: Db,
  id: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const booking = assertPaidThread(db, id, user);
  const threadRow = writableThread(db, booking);
  const input = asRecord(body) ?? {};
  const fields: Record<string, string> = {};
  const text = requireString(fields, input.body, 'body', { min: 1, max: 2000 });
  if (Object.keys(fields).length > 0) throw validationError(fields);
  const now = nowIso();
  const id_ = newId('msg');
  insertMessage(db, {
    id: id_,
    thread_id: threadRow.id,
    sender_id: user.id,
    sender_role: user.role,
    body: text as string,
    created_at: now,
  });
  return {
    id: id_,
    threadId: threadRow.id,
    senderId: user.id,
    senderRole: user.role,
    body: text,
    createdAt: now,
  };
}

export function alignment(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const booking = assertPaidThread(db, id, user);
  return alignmentCard(db, booking.id);
}

function validateItemValue(itemKey: ItemKey, raw: unknown): Record<string, unknown> {
  const input = asRecord(raw) ?? {};
  const fields: Record<string, string> = {};
  if (itemKey === 'scope') {
    const text = requireString(fields, input.text, 'text', { min: 10, max: 600 });
    if (Object.keys(fields).length > 0) throw validationError(fields);
    return { text };
  }
  if (itemKey === 'schedule') {
    const startsAt = requireString(fields, input.startsAt, 'startsAt');
    const videoUrl = isHttpUrl(input.videoUrl) ? (input.videoUrl as string) : null;
    if (videoUrl === null) fields.videoUrl = 'Tautan harus diawali http:// atau https://.';
    if (!isIntInRange(input.durationMinutes, 30, 180)) {
      fields.durationMinutes = 'Durasi 30–180 menit.';
    }
    if (startsAt !== null) {
      const at = Date.parse(startsAt);
      if (Number.isNaN(at)) fields.startsAt = 'Tanggal tidak valid.';
      else if (at < Date.now() + 60 * 60 * 1000) {
        fields.startsAt = 'Jadwal minimal 1 jam dari sekarang.';
      }
    }
    if (Object.keys(fields).length > 0) throw validationError(fields);
    return {
      startsAt,
      durationMinutes: input.durationMinutes as number,
      videoUrl,
    };
  }
  const method = requireString(fields, input.method, 'method');
  if (
    method !== null &&
    !['FREE_CONSULTATION', 'BANK_TRANSFER', 'EWALLET', 'CASH'].includes(method)
  ) {
    fields.method = 'Metode pembayaran tidak dikenal.';
  }
  const amountIdr = input.amountIdr;
  if (
    typeof amountIdr !== 'number' ||
    !Number.isInteger(amountIdr) ||
    amountIdr < 0 ||
    amountIdr > 10_000_000
  ) {
    fields.amountIdr = 'Biaya sesi 0–10.000.000 rupiah.';
  } else if (method === 'FREE_CONSULTATION' && amountIdr !== 0) {
    fields.amountIdr = 'Konsultasi gratis harus bernilai 0.';
  } else if (method !== 'FREE_CONSULTATION' && amountIdr === 0) {
    fields.amountIdr = 'Gunakan FREE_CONSULTATION untuk sesi gratis.';
  }
  const settlementNote =
    input.settlementNote === null || input.settlementNote === undefined
      ? null
      : requireString(fields, input.settlementNote, 'settlementNote', { max: 300 });
  if (Object.keys(fields).length > 0) throw validationError(fields);
  return { amountIdr, method, settlementNote };
}

export function proposeAlignment(
  db: Db,
  id: string,
  itemKey: string,
  user: AuthUser,
  body: unknown,
): Record<string, unknown> {
  const booking = assertPaidThread(db, id, user);
  writableThread(db, booking);
  const key = lockItem(itemKey);
  const value = validateItemValue(key, body);
  const existing = findAlignmentItem(db, booking.id, key);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Item kesepakatan tidak ditemukan.');

  const now = nowIso();
  updateAlignmentItem(db, existing.id, {
    value_json: JSON.stringify(value),
    version: existing.version + 1,
    proposed_by: user.id,
    proposed_at: now,
    confirmed: 0,
  });
  // A new version invalidates both earlier confirmations.
  db.prepare('DELETE FROM alignment_item_confirmations WHERE item_id = ?').run(existing.id);
  if (booking.status === 'SCHEDULED') {
    updateBooking(db, booking.id, { status: 'PAID', scheduled_at: null });
  }
  return alignmentCard(db, booking.id);
}

export function confirmAlignment(
  db: Db,
  id: string,
  itemKey: string,
  user: AuthUser,
): Record<string, unknown> {
  const booking = assertPaidThread(db, id, user);
  writableThread(db, booking);
  const key = lockItem(itemKey);
  const item = findAlignmentItem(db, booking.id, key);
  if (!item || item.value_json === null) {
    throw new AppError(409, 'ALIGNMENT_INCOMPLETE', 'Belum ada usulan untuk item ini.', {
      itemKey: key,
    });
  }
  upsertConfirmation(db, {
    item_id: item.id,
    user_id: user.id,
    item_version: item.version,
    confirmed_at: nowIso(),
  });

  const items = listAlignmentItems(db, booking.id);
  const card = serializeAlignment(db, booking.id, items, confirmationMap(db, items));

  let bookingStatus = booking.status;
  if (card.allItemsConfirmed) {
    const schedule = items.find((row) => row.key === 'schedule');
    const scheduleValue = schedule?.value_json
      ? (JSON.parse(schedule.value_json) as { startsAt: string })
      : null;
    updateBooking(db, booking.id, {
      status: 'SCHEDULED',
      scheduled_at: scheduleValue?.startsAt ?? null,
    });
    bookingStatus = 'SCHEDULED';
  }

  return {
    alignment: card,
    bookingStatus,
    allItemsConfirmed: card.allItemsConfirmed,
  };
}

export function completeBooking(db: Db, id: string, user: AuthUser): Record<string, unknown> {
  const booking = assertPaidThread(db, id, user);
  if (booking.status !== 'SCHEDULED') {
    throw new AppError(409, 'CONFLICT', 'Sesi belum berstatus SCHEDULED.', {
      bookingStatus: booking.status,
    });
  }
  const now = nowIso();
  const eligibleAt = addMinutes(now, config.reviewEligibilityMinutes);
  updateBooking(db, booking.id, {
    status: 'COMPLETED',
    completed_at: now,
    review_eligible_at: eligibleAt,
  });
  const threadRow = findThreadByBooking(db, booking.id);
  if (threadRow) {
    db.prepare("UPDATE mediation_threads SET status = 'CLOSED', closed_at = ? WHERE id = ?").run(
      now,
      threadRow.id,
    );
  }
  const updated = {
    ...booking,
    status: 'COMPLETED',
    completed_at: now,
    review_eligible_at: eligibleAt,
  };
  return {
    booking: serializeBooking(db, updated as BookingRow, user),
    reviewEligibleAt: eligibleAt,
  };
}

export function alignmentItemsFor(db: Db, bookingId: string): AlignmentItemRow[] {
  return listAlignmentItems(db, bookingId);
}
