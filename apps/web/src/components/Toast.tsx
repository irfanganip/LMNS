import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { IconCheckCircle, IconError } from './Icons';

type ToastVariant = 'success' | 'error';
type Toast = { id: number; message: string; variant: ToastVariant };

const ToastContext = createContext<{
  showToast: (message: string, variant?: ToastVariant) => void;
} | null>(null);

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used inside <ToastProvider>');
  return value;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = useCallback((message: string, variant: ToastVariant = 'success') => {
    setToast({ id: Date.now(), message, variant });
  }, []);

  useEffect(() => {
    if (!toast || toast.variant === 'error') return;
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className={`toast toast--${toast.variant}`}
          role={toast.variant === 'error' ? 'alert' : 'status'}
        >
          {toast.variant === 'success' ? <IconCheckCircle size={18} /> : <IconError size={18} />}
          <p>{toast.message}</p>
          <button
            type="button"
            className="toast__close"
            onClick={() => setToast(null)}
            aria-label="Tutup"
          >
            ×
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
