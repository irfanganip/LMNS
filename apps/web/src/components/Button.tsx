import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { IconSpinner } from './Icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  loadingLabel?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingLabel = 'Memproses…',
  icon,
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn--${variant} btn--${size}${fullWidth ? ' btn--block' : ''} ${className}`.trim()}
      aria-busy={loading || undefined}
      aria-disabled={disabled && !loading ? true : undefined}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <IconSpinner size={16} /> : icon}
      <span>{loading ? loadingLabel : children}</span>
    </button>
  );
}

/** A disabled primary action always states why, per design-system §11.1. */
export function Reason({ children }: { children: ReactNode }) {
  return <p className="field__help">{children}</p>;
}
