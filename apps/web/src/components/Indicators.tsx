import type { ReactNode } from 'react';
import { IconExternal, IconHeartCheck, IconLink, IconShield, IconStar } from './Icons';
import { copy, formatRating } from '../copy/id';
import type { Badge as BadgeShape, BookingStatus, ApplicationStatus, Tier } from '../api/types';

export function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  const initials = name
    .replace(/(Dr\.|Prof\.|M\.Sc\.|S\.Sos\.|S\.T\.|M\.Pd\.|,)/g, '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, fontSize: Math.round(size / 2.5) }}
      aria-hidden="true"
    >
      {initials || '?'}
    </span>
  );
}

const badgeIcons = {
  SISTER_VERIFIED: IconShield,
  SCOPUS_ORCID_VERIFIED: IconLink,
  LMNS_WELL_BEING_CERTIFIED: IconHeartCheck,
};

export function TrustBadge({ badge, href }: { badge: BadgeShape; href?: string | null }) {
  const Icon = badgeIcons[badge.type] ?? IconShield;
  const tone = badge.type === 'LMNS_WELL_BEING_CERTIFIED' ? 'brand' : 'info';
  const content = (
    <>
      <Icon size={14} />
      <span>{badge.label}</span>
      {href && <IconExternal size={12} />}
    </>
  );
  if (href) {
    return (
      <a
        className={`badge badge--${tone} badge--link`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
      >
        {content}
      </a>
    );
  }
  return <span className={`badge badge--${tone}`}>{content}</span>;
}

export function TierTag({ tier, label }: { tier: Tier; label: string }) {
  const tone =
    tier === 'EDUCATOR_PREMIUM' ? 'brand' : tier === 'EDUCATOR_STANDARD' ? 'info' : 'muted';
  return <span className={`badge badge--${tone}`}>{label}</span>;
}

export function StatusPill({ status }: { status: BookingStatus }) {
  const tone =
    status === 'SCHEDULED' || status === 'REVIEWED'
      ? 'success'
      : status === 'COMPLETED' || status === 'CANCELLED'
        ? 'muted'
        : status === 'PAYMENT_FAILED'
          ? 'danger'
          : 'warn';
  return (
    <span className={`status-pill status-pill--${tone}`}>
      <span className="status-pill__dot" aria-hidden="true" />
      {copy.bookingStatus[status]}
    </span>
  );
}

export function ApplicationPill({ status }: { status: ApplicationStatus }) {
  const tone =
    status === 'APPROVED'
      ? 'success'
      : status === 'REJECTED'
        ? 'danger'
        : status === 'PENDING_REVIEW'
          ? 'warn'
          : 'muted';
  return (
    <span className={`status-pill status-pill--${tone}`}>
      <span className="status-pill__dot" aria-hidden="true" />
      {copy.applicationStatus[status]}
    </span>
  );
}

export function Stars({
  value,
  label,
  size = 16,
}: {
  value: number;
  label: string;
  size?: number;
}) {
  return (
    <span className="stars" role="img" aria-label={`${label}: ${formatRating(value)} dari 5`}>
      {[1, 2, 3, 4, 5].map((index) => (
        <span
          key={index}
          className={`stars__star${value >= index - 0.25 ? ' stars__star--on' : ''}`}
          style={{ width: size, height: size }}
        >
          <IconStar size={size} />
        </span>
      ))}
    </span>
  );
}

/** Two axes, always rendered separately — never a blended average. */
export function RatingSummary({
  academicGuidance,
  wellBeingSupport,
  reviewCount,
  compact = false,
}: {
  academicGuidance: number | null;
  wellBeingSupport: number | null;
  reviewCount: number;
  compact?: boolean;
}) {
  if (reviewCount === 0 || academicGuidance === null || wellBeingSupport === null) {
    return <p className="rating-empty">{copy.reviewNone}</p>;
  }
  const rows = [
    { key: 'Akademik', full: copy.reviewAxis1, value: academicGuidance },
    { key: 'Kesejahteraan', full: copy.reviewAxis2, value: wellBeingSupport },
  ];
  return (
    <div className={`rating-summary${compact ? ' rating-summary--compact' : ''}`}>
      {rows.map((row) => (
        <div className="rating-summary__row" key={row.key}>
          <span className="rating-summary__label" aria-label={row.full}>
            {row.key}
          </span>
          <Stars value={row.value} label={row.full} />
          <span className="rating-summary__value">{formatRating(row.value)}</span>
          <span className="rating-summary__count">({reviewCount} ulasan)</span>
        </div>
      ))}
    </div>
  );
}

export function RatingInput({
  id,
  label,
  help,
  value,
  error,
  disabled,
  onChange,
}: {
  id: string;
  label: string;
  help: string;
  value: number | null;
  error?: string | null;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className={`rating-input${error ? ' rating-input--error' : ''}`} id={id}>
      <legend className="rating-input__label">{label}</legend>
      <p className="rating-input__help">{help}</p>
      <div className="rating-input__stars" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((index) => (
          <label
            key={index}
            className={`rating-input__star${value === index ? ' is-selected' : ''}`}
          >
            <input
              type="radio"
              name={id}
              value={index}
              checked={value === index}
              disabled={disabled}
              onChange={() => onChange(index)}
              aria-label={`${index} — ${['Sangat kurang', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'][index - 1]}`}
            />
            <IconStar size={28} />
          </label>
        ))}
      </div>
      <div className="rating-input__anchors" aria-hidden="true">
        <span>Sangat kurang</span>
        <span>Cukup</span>
        <span>Sangat baik</span>
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: {
    label: string;
    href?: string;
    state?: 'done' | 'current' | 'upcoming' | 'error' | 'skipped';
  }[];
  current: number;
}) {
  return (
    <ol className="stepper">
      {steps.map((step, index) => {
        const state =
          step.state ?? (index < current ? 'done' : index === current ? 'current' : 'upcoming');
        return (
          <li
            key={step.label}
            className={`stepper__step stepper__step--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="stepper__node">{state === 'done' ? '✓' : index + 1}</span>
            <span className="stepper__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Tabs({
  items,
  value,
  onChange,
  label,
}: {
  items: { value: string; label: string; count?: number }[];
  value: string;
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="tab"
          aria-selected={item.value === value}
          className={`tabs__tab${item.value === value ? ' tabs__tab--active' : ''}`}
          onClick={() => onChange(item.value)}
        >
          {item.label}
          {typeof item.count === 'number' && <span className="tabs__count">{item.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function FilterChip({
  label,
  count,
  selected,
  onClick,
  disabled,
}: {
  label: string;
  count?: number;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`chip${selected ? ' chip--selected' : ''}`}
      aria-pressed={selected}
      onClick={onClick}
      disabled={disabled}
    >
      {selected && <span aria-hidden="true">✓</span>}
      {label}
      {typeof count === 'number' && <span className="chip__count">({count})</span>}
    </button>
  );
}

export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
