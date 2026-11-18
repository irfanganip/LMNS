export type Health = {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  database: { status: 'ok' | 'error'; seededAt: string | null; users: number; mentors: number };
};

export type RuntimeConfig = {
  platformFeeIdr: number;
  tierLabels: Record<string, string>;
  allowedEmailDomains: string[];
  demoMode: boolean;
  disclaimer: string;
};

async function getJson<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(path, { signal });
  if (!response.ok) {
    throw new Error(`Permintaan ${path} gagal (${response.status})`);
  }
  return (await response.json()) as T;
}

export function loadBootstrap(signal: AbortSignal): Promise<[Health, RuntimeConfig]> {
  return Promise.all([
    getJson<Health>('/api/health', signal),
    getJson<RuntimeConfig>('/api/config', signal),
  ]);
}
