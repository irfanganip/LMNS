import type { ReactNode } from 'react';

export function Skeleton({
  width,
  height,
  radius,
}: {
  width?: string;
  height?: number;
  radius?: string;
}) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{
        width: width ?? '100%',
        height: height ?? 12,
        borderRadius: radius ?? 'var(--radius-sm)',
      }}
    />
  );
}

export function SkeletonLines({ lines = 2 }: { lines?: number }) {
  const widths = ['100%', '82%', '64%', '90%', '70%'];
  return (
    <span className="skeleton-lines" aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} width={widths[index % widths.length]} />
      ))}
    </span>
  );
}

export function MentorCardSkeleton() {
  return (
    <div className="card mentor-card" aria-hidden="true">
      <div className="mentor-card__head">
        <span
          className="skeleton"
          style={{ width: 56, height: 56, borderRadius: 'var(--radius-pill)' }}
        />
        <span className="skeleton-lines">
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" />
        </span>
      </div>
      <SkeletonLines lines={2} />
      <div className="mentor-card__badges">
        <span
          className="skeleton"
          style={{ width: 92, height: 24, borderRadius: 'var(--radius-pill)' }}
        />
        <span
          className="skeleton"
          style={{ width: 76, height: 24, borderRadius: 'var(--radius-pill)' }}
        />
      </div>
      <Skeleton width="40%" />
    </div>
  );
}

export function ListSkeleton({ rows = 4, children }: { rows?: number; children?: ReactNode }) {
  return (
    <div className="skeleton-list" aria-busy="true">
      <span className="visually-hidden">Memuat…</span>
      {children ?? Array.from({ length: rows }, (_, index) => <MentorCardSkeleton key={index} />)}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="table-skeleton">
      <span className="visually-hidden">Memuat…</span>
      {Array.from({ length: rows }, (_, index) => (
        <div className="table-skeleton__row" key={index}>
          <Skeleton width="30%" height={16} />
          <Skeleton width="18%" />
          <Skeleton width="14%" />
          <Skeleton width="10%" />
        </div>
      ))}
    </div>
  );
}
