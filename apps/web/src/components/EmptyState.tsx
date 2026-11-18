import type { ReactNode } from 'react';
import { Button } from './Button';
import { IconError, IconSearch } from './Icons';
import { copy } from '../copy/id';

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  body?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <span className="empty__icon">{icon ?? <IconSearch size={48} />}</span>
      <h3 className="empty__title">{title}</h3>
      {body && <p className="empty__body">{body}</p>}
      {action && <div className="empty__action">{action}</div>}
    </div>
  );
}

/** The single error-recovery block every list and form imports. */
export function ErrorRetry({
  message,
  onRetry,
  retryLabel = copy.retry,
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <div className="error-retry" role="alert">
      <IconError size={20} />
      <p>{message}</p>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        {retryLabel}
      </Button>
    </div>
  );
}
