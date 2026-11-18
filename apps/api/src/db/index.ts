import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { config } from '../config.js';

const schemaSql = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'schema.sql'),
  'utf8',
);

export type Db = DatabaseSync;

/**
 * Opens the SQLite file, creating its directory when missing.
 * `:memory:` is honoured for tests.
 */
export function openDb(databasePath: string = config.dbPath): Db {
  if (databasePath !== ':memory:') {
    mkdirSync(path.dirname(databasePath), { recursive: true });
  }
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

/** Applies the idempotent schema. Safe on every boot. */
export function migrate(db: Db): void {
  db.exec(schemaSql);
}

export function isSeeded(db: Db): boolean {
  const row = db.prepare('SELECT value FROM seed_meta WHERE key = ?').get('seeded_at');
  return row !== undefined;
}

export function seededAt(db: Db): string | null {
  const row = db.prepare('SELECT value FROM seed_meta WHERE key = ?').get('seeded_at') as
    { value: string } | undefined;
  return row?.value ?? null;
}

export function countRows(db: Db, table: 'users' | 'mentor_profiles'): number {
  const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get() as { count: number };
  return row.count;
}
