import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Repository root, resolved from this file at `apps/api/src/config.ts`. */
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

// `.env` at the repository root is optional; no secrets live in this project.
try {
  process.loadEnvFile(path.join(repoRoot, '.env'));
} catch {
  // No .env file — defaults apply.
}

function readString(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function readInt(name: string, fallback: number): number {
  const raw = readString(name, String(fallback));
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`Invalid ${name}: expected a non-negative integer, got "${raw}"`);
  }
  return parsed;
}

/** Tier keys are code (D2); labels are copy and must stay configurable. */
export const TIER_KEYS = ['BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM'] as const;
export type TierKey = (typeof TIER_KEYS)[number];

const defaultTierLabels: Record<TierKey, string> = {
  BASIC: 'Basic Mentor',
  EDUCATOR_STANDARD: 'Educator Mentor',
  EDUCATOR_PREMIUM: 'Premium Educator Mentor',
};

function readTierLabels(name: string): Record<TierKey, string> {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return defaultTierLabels;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Invalid ${name}: expected a JSON object`);
  }
  const labels = { ...defaultTierLabels };
  for (const key of TIER_KEYS) {
    const value = (parsed as Record<string, unknown> | null)?.[key];
    if (typeof value === 'string' && value.trim() !== '') labels[key] = value.trim();
  }
  return labels;
}

/** What the platform fee buys. Copy lives here so no route hard-codes it. */
const defaultPlatformFeeCovers = [
  'Verifikasi kredensial mentor',
  'Ruang mediasi pra-sesi',
  'Penanganan sengketa',
];

function readList(name: string, fallback: string[]): string[] {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  env: readString('NODE_ENV', 'development'),
  port: readInt('PORT', 3001),
  dbPath: path.resolve(repoRoot, 'apps/api', readString('DATABASE_PATH', './data/lmns.db')),
  platformFeeIdr: readInt('PLATFORM_FEE_IDR', 50_000),
  demoOtp: readString('DEMO_OTP', '123456'),
  tierLabels: readTierLabels('TIER_LABELS'),
  allowedEmailDomains: readString('ALLOWED_EMAIL_DOMAINS', 'ac.id,edu')
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean),
  platformFeeCovers: readList('PLATFORM_FEE_COVERS', defaultPlatformFeeCovers),
  contactPolicy:
    'Kontak langsung baru dibuka setelah biaya platform dibayar. Jangan bertukar kontak di luar kanal ini.',
  receiptDisclaimer: 'Prototipe demo: pembayaran disimulasikan dan tidak ada dana yang berpindah.',
  /** SLA for an application decision, in calendar days (see data-model §6). */
  applicationSlaDays: 3,
  /** Review prompt delay after a session completes. */
  reviewEligibilityMinutes: 60,
} as const;

export type Config = typeof config;

/** Public runtime config (docs/api-contract.md §4). */
export function demoConfig(): Record<string, unknown> {
  return {
    platformFeeIdr: config.platformFeeIdr,
    tierLabels: config.tierLabels,
    allowedEmailDomains: config.allowedEmailDomains,
    demoMode: true,
    disclaimer:
      'Prototipe demo: pembayaran disimulasikan, OTP ditampilkan langsung, dan tidak ada layanan klinis.',
    platformFeeCovers: config.platformFeeCovers,
  };
}
