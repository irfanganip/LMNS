/** Minimal typed client for docs/api-contract.md. */

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.code = payload.code;
    this.status = status;
    this.details = payload.details ?? {};
  }
}

const STORAGE_KEY = 'lmns.token';

let token: string | null = readStoredToken();

function readStoredToken(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  return token;
}

export function setToken(value: string | null): void {
  token = value;
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage may be unavailable in private mode; the in-memory token still works */
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as { name?: string }).name === 'AbortError') throw error;
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Tidak dapat menghubungi server. Periksa koneksi lalu coba lagi.',
    });
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const envelope = payload as { error?: ApiErrorPayload } | null;
    throw new ApiError(
      response.status,
      envelope?.error ?? {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan pada server. Coba lagi.',
      },
    );
  }

  return payload as T;
}

/** Network/validation failure → a sentence safe to render in an inline banner. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === 'NETWORK_ERROR') return error.message;
    return error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Tidak dapat memuat data. Periksa koneksi lalu coba lagi.';
}

export function fieldErrors(error: unknown): Record<string, string> {
  if (error instanceof ApiError) {
    const fields = error.details.fields;
    if (fields && typeof fields === 'object') return fields as Record<string, string>;
  }
  return {};
}
