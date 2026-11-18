import type { ReactNode } from 'react';
import { IconCheckCircle, IconError, IconInfo, IconWarning } from './Icons';

export type BannerVariant = 'info' | 'success' | 'warning' | 'danger';

type BannerProps = {
  variant?: BannerVariant;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
};

const icons = {
  info: IconInfo,
  success: IconCheckCircle,
  warning: IconWarning,
  danger: IconError,
};

export function Banner({ variant = 'info', title, children, action }: BannerProps) {
  const Icon = icons[variant];
  return (
    <div className={`banner banner--${variant}`} role={variant === 'danger' ? 'alert' : 'status'}>
      <span className="banner__icon">
        <Icon size={20} />
      </span>
      <div className="banner__body">
        {title && <p className="banner__title">{title}</p>}
        {children && <div className="banner__text">{children}</div>}
      </div>
      {action && <div className="banner__action">{action}</div>}
    </div>
  );
}
