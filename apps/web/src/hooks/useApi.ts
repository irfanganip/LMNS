import { useEffect, useRef, useState } from 'react';
import { api, errorMessage } from '../api/client';

export type AsyncState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: unknown; message: string }
  | { status: 'ready'; data: T };

/**
 * Reads one API resource and exposes the loading / error / ready states the
 * state matrix requires. `path === null` keeps the request from firing (for
 * screens that depend on a route param).
 */
export function useApi<T>(path: string | null, reloadKey = 0) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'loading' });
  const [localKey, setLocalKey] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (path === null) {
      setState({ status: 'loading' });
      return;
    }
    const controller = new AbortController();
    setState({ status: 'loading' });
    api<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setState({ status: 'ready', data });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', error, message: errorMessage(error) });
      });
    return () => controller.abort();
  }, [path, reloadKey, localKey]);

  return {
    state,
    setState,
    /** Replaces the loaded value in place (used after a mutation returns the new shape). */
    setData: (updater: (current: T) => T) =>
      setState((current) =>
        current.status === 'ready' ? { status: 'ready', data: updater(current.data) } : current,
      ),
    reload: () => setLocalKey((n) => n + 1),
  };
}

export type ActionState = {
  pending: boolean;
  error: unknown;
  message: string | null;
};

/** Mutation helper: pending + error, with the values of the caller's form left intact. */
export function useAction() {
  const [state, setState] = useState<ActionState>({ pending: false, error: null, message: null });

  async function run<T>(fn: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> {
    setState({ pending: true, error: null, message: null });
    try {
      const value = await fn();
      setState({ pending: false, error: null, message: null });
      return { ok: true, value };
    } catch (error) {
      setState({ pending: false, error, message: errorMessage(error) });
      return { ok: false };
    }
  }

  return { ...state, run, reset: () => setState({ pending: false, error: null, message: null }) };
}
