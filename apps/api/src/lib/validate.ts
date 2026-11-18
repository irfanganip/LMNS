import { AppError } from '../http/errors.js';

export type FieldErrors = Record<string, string>;

/** `422 VALIDATION_ERROR` with the documented `details.fields` shape. */
export function validationError(fields: FieldErrors): AppError {
  return new AppError(422, 'VALIDATION_ERROR', 'Data yang dikirim belum valid.', { fields });
}

export function requireString(
  fields: FieldErrors,
  value: unknown,
  name: string,
  options: { min?: number; max?: number; optional?: boolean } = {},
): string | null {
  if (value === undefined || value === null) {
    if (options.optional) return null;
    fields[name] = 'Wajib diisi.';
    return null;
  }
  if (typeof value !== 'string') {
    fields[name] = 'Harus berupa teks.';
    return null;
  }
  const trimmed = value.trim();
  if (options.min !== undefined && trimmed.length < options.min) {
    fields[name] = `Minimal ${options.min} karakter.`;
    return null;
  }
  if (options.max !== undefined && trimmed.length > options.max) {
    fields[name] = `Maksimal ${options.max} karakter.`;
    return null;
  }
  if (options.optional && trimmed === '') return null;
  return trimmed;
}

const URL_RE = /^https?:\/\/\S+$/i;

export function isHttpUrl(value: unknown): boolean {
  return typeof value === 'string' && URL_RE.test(value);
}

export function isEmail(value: unknown): boolean {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function emailDomain(email: string): string {
  return email.slice(email.lastIndexOf('@') + 1).toLowerCase();
}

export function domainAllowed(email: string, suffixes: readonly string[]): boolean {
  const domain = emailDomain(email);
  return suffixes.some((suffix) => domain === suffix || domain.endsWith(`.${suffix}`));
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function isIntInRange(value: unknown, min: number, max: number): boolean {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}
