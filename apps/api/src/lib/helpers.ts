import { randomBytes } from 'node:crypto';

/** Runtime ids. Seed ids are fixed strings; these only exist for new rows. */
export function newId(prefix: string): string {
  return `${prefix}_${randomBytes(6).toString('hex')}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function addMinutes(iso: string, minutes: number): string {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}

export function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * 86_400_000).toISOString();
}

export function parseJson<T>(value: unknown, fallback: T): T {
  if (typeof value !== 'string' || value === '') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

export interface Pagination {
  page: number;
  pageSize: number;
  offset: number;
}

export function readPagination(query: Record<string, unknown>): Pagination {
  const page = toPositiveInt(query.page, 1);
  const rawSize = toPositiveInt(query.pageSize, 12);
  const pageSize = Math.min(rawSize, 50);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

function toPositiveInt(value: unknown, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string' || raw.trim() === '') return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

/** Repeatable query param: `?tier=A&tier=B` or `?tier=A,B`. */
export function readList(query: Record<string, unknown>, key: string): string[] {
  const raw = query[key];
  if (raw === undefined) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  return values
    .flatMap((value) => (typeof value === 'string' ? value.split(',') : []))
    .map((value) => value.trim())
    .filter(Boolean);
}

export function readString(query: Record<string, unknown>, key: string): string | null {
  const raw = query[key];
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
