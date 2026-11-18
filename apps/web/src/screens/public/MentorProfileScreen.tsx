import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import type { MentorProfile, ReviewPublic, VerifiedLinks } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Button } from '../../components/Button';
import { EmptyState, ErrorRetry } from '../../components/EmptyState';
import { Avatar, RatingSummary, Section, TierTag, TrustBadge } from '../../components/Indicators';
import { IconExternal } from '../../components/Icons';
import { Skeleton, SkeletonLines } from '../../components/Skeleton';
import { copy, formatDate, formatRating, formatRupiah } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

const languageLabels: Record<string, string> = { id: 'Bahasa Indonesia', en: 'Inggris' };
const formatLabels: Record<string, string> = { online: 'Online', 'in-person': 'Tatap muka' };

export function MentorProfileScreen() {
  const { slug = '' } = useParams();
  const { session, config } = useSession();
  const navigate = useNavigate();
  const { state, reload } = useApi<MentorProfile>(`/mentors/${slug}`);

  if (state.status === 'loading') {
    return (
      <div className="stack">
        <div className="card profile-hero">
          <span
            className="skeleton"
            style={{ width: 96, height: 96, borderRadius: 'var(--radius-pill)' }}
          />
          <div className="stack stack--sm" style={{ flex: 1 }}>
            <Skeleton width="46%" height={28} />
            <Skeleton width="32%" />
            <Skeleton width="62%" />
          </div>
        </div>
        <div className="card">
          <SkeletonLines lines={4} />
        </div>
        <div className="card">
          <SkeletonLines lines={3} />
        </div>
      </div>
    );
  }

  if (state.status === 'error') {
    const notListed = state.error instanceof ApiError && state.error.status === 404;
    if (notListed) {
      return (
        <EmptyState
          title={copy.notFoundRecord}
          body="Mentor tidak ditemukan atau belum terbit di marketplace."
          action={
            <Button variant="secondary" onClick={() => navigate('/')}>
              {copy.findMentor}
            </Button>
          }
        />
      );
    }
    return (
      <ErrorRetry
        message={`Gagal memuat sebagian data mentor. ${state.message}`}
        onRetry={reload}
      />
    );
  }

  const mentor = state.data;
  const reviews = mentor.reviews?.recent ?? [];
  const aggregates = mentor.reviews?.aggregates ?? mentor.rating;
  const authenticated = session.phase === 'authenticated';
  const isMentee = session.phase === 'authenticated' && session.me.user.role === 'MENTEE';
  const bookingHref = authenticated
    ? `/booking/baru/${mentor.slug}`
    : `/masuk?next=/booking/baru/${mentor.slug}`;

  return (
    <div className="stack stack--lg profile">
      <div className="profile__main">
        <header className="card profile-hero">
          <Avatar name={mentor.displayName} size={96} />
          <div className="profile-hero__id">
            <h1 className="profile-hero__name">{mentor.displayName}</h1>
            <p className="profile-hero__title">
              {mentor.academicTitle}
              {mentor.institution ? ` · ${mentor.institution}` : ''}
            </p>
            <div className="profile-hero__tags">
              <TierTag tier={mentor.tier} label={mentor.tierLabel} />
              {mentor.discipline && <span className="tag">{mentor.discipline}</span>}
              {mentor.languages.map((language) => (
                <span className="tag tag--soft" key={language}>
                  {languageLabels[language] ?? language}
                </span>
              ))}
              {mentor.formats.map((format) => (
                <span className="tag tag--soft" key={format}>
                  {formatLabels[format] ?? format}
                </span>
              ))}
            </div>
            {mentor.badges.length > 0 && (
              <ul className="profile-hero__badges" aria-label="Penanda terverifikasi">
                {mentor.badges.map((badge) => (
                  <li key={badge.type}>
                    <TrustBadge badge={badge} href={badgeLink(badge.type, mentor.verifiedLinks)} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </header>

        <Section title="Tentang & filosofi pendampingan">
          <div className="card prose">
            <p>{mentor.intro ?? 'Mentor ini belum menuliskan pengantar.'}</p>
            {mentor.wellBeingPhilosophy && (
              <>
                <h3 className="prose__subhead">Pendekatan kesejahteraan</h3>
                <p>{mentor.wellBeingPhilosophy}</p>
              </>
            )}
          </div>
        </Section>

        {mentor.strengths.length > 0 && (
          <Section title="Keahlian & metode">
            <div className="card">
              <ul className="tag-list">
                {mentor.strengths.map((strength) => (
                  <li className="tag tag--soft" key={strength}>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}

        <Section title="Paket sesi">
          <div className="card">
            {mentor.packages.length === 0 ? (
              <p className="muted">{copy.noPackages}</p>
            ) : (
              <ul className="package-list">
                {mentor.packages.map((pkg) => (
                  <li key={pkg.id} className="package-row">
                    <div>
                      <p className="package-row__title">{pkg.title}</p>
                      <p className="muted">{pkg.description}</p>
                      <p className="muted">{pkg.durationMinutes} menit</p>
                    </div>
                    <div className="package-row__price">
                      {pkg.isFreeConsultation ? 'Konsultasi gratis' : formatRupiah(pkg.priceIdr)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Section>

        <VerifiedLinksBlock links={mentor.verifiedLinks} />

        <Section title="Ulasan">
          <div className="card stack">
            {aggregates && aggregates.reviewCount > 0 ? (
              <RatingSummary
                academicGuidance={aggregates.academicGuidance}
                wellBeingSupport={aggregates.wellBeingSupport}
                reviewCount={aggregates.reviewCount}
              />
            ) : (
              <p className="muted">{copy.reviewNone}</p>
            )}
            <p className="muted small">{copy.reviewSeparate}</p>
            <ul className="review-list">
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </ul>
          </div>
        </Section>
      </div>

      <aside className="profile__aside" aria-label="Ajukan sesi">
        <div className="card booking-panel">
          <p className="booking-panel__label">Honor sesi</p>
          <p className="booking-panel__price">
            {mentor.freeConsultation || mentor.startingFeeIdr === 0
              ? 'Gratis (Rp 0)'
              : `Mulai ${formatRupiah(mentor.startingFeeIdr)}`}
          </p>
          <p className="muted small">
            {config
              ? `Biaya platform ${formatRupiah(config.platformFeeIdr)} dibayar terpisah.`
              : 'Biaya platform dimuat dari konfigurasi.'}
          </p>
          <p className="muted small">
            Honor sesi disepakati langsung dengan mentor setelah biaya platform dibayar.
          </p>
          {isMentee || !authenticated ? (
            <Link className="btn btn--primary btn--md btn--block" to={bookingHref}>
              {authenticated ? 'Ajukan sesi' : 'Masuk untuk mengajukan sesi'}
            </Link>
          ) : (
            <p className="field__help">Ajukan sesi tersedia untuk akun mentee.</p>
          )}
          {mentor.tier === 'EDUCATOR_PREMIUM' && (
            <p className="muted small">
              Mentor Premium Educator: sertifikasi Well-Being LMNS diverifikasi. Manfaat yang
              tercantum mengikuti apa yang benar-benar disediakan mentor ini.
            </p>
          )}
        </div>
      </aside>
    </div>
  );
}

function ReviewItem({ review }: { review: ReviewPublic }) {
  return (
    <li className="review">
      <div className="review__head">
        <Avatar name={`${review.menteeInitial} ${review.menteeInitial}`} size={32} />
        <div>
          <p className="review__author">{review.menteeInitial}</p>
          <p className="muted small">{formatDate(review.createdAt)}</p>
        </div>
      </div>
      <div className="review__axes">
        <span>
          Akademik: <strong>{formatRating(review.academicGuidance)}</strong>
        </span>
        <span>
          Kesejahteraan: <strong>{formatRating(review.wellBeingSupport)}</strong>
        </span>
      </div>
      {review.comment && <p className="review__comment">{review.comment}</p>}
    </li>
  );
}

function isUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && /^https?:\/\//.test(value);
}

/** Reviewers may record an identifier instead of a profile URL; expand the ones we can address. */
function identifierHref(label: string, value: string): string | null {
  if (label === 'Scopus' && /^\d+$/.test(value)) {
    return `https://www.scopus.com/authid/detail.uri?authorId=${value}`;
  }
  if (label === 'ORCID' && /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(value)) {
    return `https://orcid.org/${value}`;
  }
  return null;
}

function badgeLink(type: string, links: VerifiedLinks | null): string | null {
  if (!links) return null;
  if (type === 'SCOPUS_ORCID_VERIFIED') {
    return (
      [links.scopus, links.orcid].find((value) => isUrl(value)) ??
      (links.scopus ? identifierHref('Scopus', links.scopus) : null) ??
      (links.orcid ? identifierHref('ORCID', links.orcid) : null)
    );
  }
  if (type === 'SISTER_VERIFIED') return [links.institutional, links.sisterId].find(isUrl) ?? null;
  return null;
}

function VerifiedLinksBlock({ links }: { links: VerifiedLinks | null }) {
  if (!links) return null;
  const entries: { label: string; value: string | null }[] = [
    { label: 'Google Scholar', value: links.googleScholar },
    { label: 'LinkedIn', value: links.linkedin },
    { label: 'Scopus', value: links.scopus },
    { label: 'ORCID', value: links.orcid },
    { label: 'Situs institusi', value: links.institutional },
  ];
  const filled = entries.filter((entry): entry is { label: string; value: string } =>
    Boolean(entry.value),
  );
  // A reviewer may record an identifier (Scopus/ORCID number) rather than a URL.
  const urls = filled.filter((entry) => isUrl(entry.value));
  const identifiers = filled.filter(
    (entry) => !isUrl(entry.value) && identifierHref(entry.label, entry.value) === null,
  );
  const expanded = filled
    .filter((entry) => !isUrl(entry.value) && identifierHref(entry.label, entry.value) !== null)
    .map((entry) => ({ label: entry.label, value: identifierHref(entry.label, entry.value)! }));
  if (urls.length === 0 && identifiers.length === 0 && !links.sisterId && expanded.length === 0) {
    return null;
  }
  return (
    <Section title="Tautan terverifikasi">
      <div className="card">
        <ul className="link-list">
          {links.sisterId && (
            <li>
              <span className="link-list__label">SISTER ID</span>
              <span className="mono">{links.sisterId}</span>
            </li>
          )}
          {identifiers.map((entry) => (
            <li key={entry.label}>
              <span className="link-list__label">{entry.label}</span>
              <span className="mono">{entry.value}</span>
            </li>
          ))}
          {[...urls, ...expanded].map((entry) => (
            <li key={entry.label}>
              <a href={entry.value ?? '#'} target="_blank" rel="noopener noreferrer">
                {entry.label} <IconExternal size={14} />
                <span className="visually-hidden">(buka di tab baru)</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
