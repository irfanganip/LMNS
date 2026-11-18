import { Link } from 'react-router-dom';
import type { MentorCard as MentorCardShape } from '../api/types';
import { copy, formatRupiah } from '../copy/id';
import { Avatar, RatingSummary, TierTag, TrustBadge } from './Indicators';

export function MentorCardView({ mentor }: { mentor: MentorCardShape }) {
  const focus = mentor.researchFocus.slice(0, 4);
  const overflow = mentor.researchFocus.length - focus.length;
  return (
    <article className="card mentor-card">
      <div className="mentor-card__head">
        <Avatar name={mentor.displayName} size={56} />
        <div className="mentor-card__id">
          <h3 className="mentor-card__name">
            <Link to={`/mentor/${mentor.slug}`}>{mentor.displayName}</Link>
          </h3>
          <p className="mentor-card__title">
            {mentor.academicTitle ?? '—'}
            {mentor.institution ? ` · ${mentor.institution}` : ''}
          </p>
        </div>
      </div>

      <div className="mentor-card__tags">
        <TierTag tier={mentor.tier} label={mentor.tierLabel} />
        {mentor.discipline && <span className="tag">{mentor.discipline}</span>}
      </div>

      {mentor.badges.length > 0 && (
        <ul className="mentor-card__badges" aria-label="Penanda terverifikasi">
          {mentor.badges.map((badge) => (
            <li key={badge.type}>
              <TrustBadge badge={badge} />
            </li>
          ))}
        </ul>
      )}

      {focus.length > 0 && (
        <ul className="mentor-card__focus" aria-label="Fokus riset">
          {focus.map((item) => (
            <li key={item} className="tag tag--soft">
              {item}
            </li>
          ))}
          {overflow > 0 && <li className="tag tag--soft">+{overflow}</li>}
        </ul>
      )}

      {mentor.rating && mentor.rating.reviewCount > 0 ? (
        <RatingSummary
          academicGuidance={mentor.rating.academicGuidance}
          wellBeingSupport={mentor.rating.wellBeingSupport}
          reviewCount={mentor.rating.reviewCount}
          compact
        />
      ) : (
        <p className="rating-empty">{copy.reviewNone}</p>
      )}

      <div className="mentor-card__foot">
        <p className="mentor-card__fee">
          {mentor.freeConsultation
            ? 'Konsultasi gratis'
            : `Mulai ${formatRupiah(mentor.startingFeeIdr)}`}
        </p>
        <Link className="btn btn--secondary btn--sm" to={`/mentor/${mentor.slug}`}>
          Lihat profil
        </Link>
      </div>
    </article>
  );
}
