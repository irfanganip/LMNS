import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, errorMessage, getToken, setToken } from '../api/client';
import type { MenteeProfile, MentorCard, RuntimeConfig, User } from '../api/types';

type Me = {
  user: User;
  menteeProfile: MenteeProfile | null;
  mentorProfile: MentorCard | null;
  permissions: string[];
};

export type SessionState =
  | { phase: 'idle' }
  | { phase: 'loading' }
  | { phase: 'anonymous' }
  | { phase: 'authenticated'; me: Me };

type SessionContextValue = {
  session: SessionState;
  config: RuntimeConfig | null;
  configError: string | null;
  login: (email: string) => Promise<Me>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
  reloadConfig: () => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ phase: 'idle' });
  const [config, setConfig] = useState<RuntimeConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [configKey, setConfigKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setConfigError(null);
    api<RuntimeConfig>('/config', { signal: controller.signal })
      .then((value) => setConfig(value))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setConfigError(errorMessage(error));
      });
    return () => controller.abort();
  }, [configKey]);

  const refreshMe = useCallback(async () => {
    if (!getToken()) {
      setSession({ phase: 'anonymous' });
      return;
    }
    setSession({ phase: 'loading' });
    try {
      const me = await api<Me>('/auth/me');
      setSession({ phase: 'authenticated', me });
    } catch {
      setToken(null);
      setSession({ phase: 'anonymous' });
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string) => {
    const result = await api<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: { email },
    });
    setToken(result.token);
    const me = await api<Me>('/auth/me');
    setSession({ phase: 'authenticated', me });
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } catch {
      /* the local session is cleared regardless */
    }
    setToken(null);
    setSession({ phase: 'anonymous' });
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      config,
      configError,
      login,
      logout,
      refreshMe,
      reloadConfig: () => setConfigKey((n) => n + 1),
    }),
    [session, config, configError, login, logout, refreshMe],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function tierLabel(config: RuntimeConfig | null, tier: string | undefined): string {
  if (!config || !tier) return '—';
  return config.tierLabels[tier] ?? tier;
}
