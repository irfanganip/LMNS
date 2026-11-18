import type { Db } from '../db/index.js';

export interface ReasonRow {
  code: string;
  scope: 'APPLICATION' | 'UPGRADE' | 'BADGE';
  label: string;
  text: string;
}

export interface AuditRow {
  id: string;
  entity_type: string;
  entity_id: string;
  actor_id: string;
  action: string;
  reason_code: string | null;
  note: string | null;
  created_at: string;
}

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  payload_json: string;
  read_at: string | null;
  created_at: string;
}

export function findReason(db: Db, code: string, scope?: string): ReasonRow | undefined {
  return scope
    ? (db
        .prepare('SELECT * FROM templated_reasons WHERE code = ? AND scope = ?')
        .get(code, scope) as ReasonRow | undefined)
    : (db.prepare('SELECT * FROM templated_reasons WHERE code = ?').get(code) as
        ReasonRow | undefined);
}

export function listReasons(db: Db, scope?: string): ReasonRow[] {
  return scope
    ? (db
        .prepare('SELECT * FROM templated_reasons WHERE scope = ? ORDER BY code')
        .all(scope) as unknown as ReasonRow[])
    : (db
        .prepare('SELECT * FROM templated_reasons ORDER BY scope, code')
        .all() as unknown as ReasonRow[]);
}

export function insertAudit(db: Db, row: AuditRow): void {
  db.prepare(
    `INSERT INTO audit_events (id, entity_type, entity_id, actor_id, action, reason_code, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    row.id,
    row.entity_type,
    row.entity_id,
    row.actor_id,
    row.action,
    row.reason_code,
    row.note,
    row.created_at,
  );
}

export function listAudit(
  db: Db,
  filter: { entityType?: string; entityId?: string; limit: number; offset: number },
): { rows: AuditRow[]; total: number } {
  const where: string[] = [];
  const params: string[] = [];
  if (filter.entityType) {
    where.push('entity_type = ?');
    params.push(filter.entityType);
  }
  if (filter.entityId) {
    where.push('entity_id = ?');
    params.push(filter.entityId);
  }
  const clause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT * FROM audit_events ${clause} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    )
    .all(...params, filter.limit, filter.offset) as unknown as AuditRow[];
  const total = (
    db.prepare(`SELECT COUNT(*) AS count FROM audit_events ${clause}`).get(...params) as {
      count: number;
    }
  ).count;
  return { rows, total };
}

export function insertNotification(db: Db, row: NotificationRow): void {
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, payload_json, read_at, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  ).run(row.id, row.user_id, row.type, row.payload_json, row.read_at, row.created_at);
}

export function listNotifications(db: Db, userId: string, unreadOnly: boolean): NotificationRow[] {
  const clause = unreadOnly ? 'AND read_at IS NULL' : '';
  return db
    .prepare(
      `SELECT * FROM notifications WHERE user_id = ? ${clause} ORDER BY created_at DESC, id DESC`,
    )
    .all(userId) as unknown as NotificationRow[];
}

export function unreadCount(db: Db, userId: string): number {
  return (
    db
      .prepare('SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND read_at IS NULL')
      .get(userId) as { count: number }
  ).count;
}

export function findNotification(db: Db, id: string): NotificationRow | undefined {
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id) as
    NotificationRow | undefined;
}

export function markNotificationRead(db: Db, id: string, at: string): void {
  db.prepare('UPDATE notifications SET read_at = ? WHERE id = ?').run(at, id);
}

export function listAdminIds(db: Db): string[] {
  return (db.prepare("SELECT id FROM users WHERE role = 'ADMIN'").all() as { id: string }[]).map(
    (row) => row.id,
  );
}
