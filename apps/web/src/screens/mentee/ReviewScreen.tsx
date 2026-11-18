import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, errorMessage } from '../../api/client';
import type { ReviewEligibility, ReviewPublic } from '../../api/types';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { RatingInput, Stars } from '../../components/Indicators';
import { SkeletonLines } from '../../components/Skeleton';
import { copy, formatDateTime, formatRating } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

const moodOptions = [
  { value: 1, label: 'Jauh lebih ringan' },
  { value: 2, label: 'Sedikit lebih ringan' },
  { value: 3, label: 'Sama saja' },
  { value: 4, label: 'Sedikit lebih berat' },
  { value: 5, label: 'Jauh lebih berat' },
];

export function ReviewScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { state, reload } = useApi<ReviewEligibility>(`/bookings/${id}/review`);

  const [step, setStep] = useState<'rating' | 'mood'>('rating');
  const [academic, setAcademic] = useState<number | null>(null);
  const [wellBeing, setWellBeing] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [mood, setMood] = useState<number | null>(null);
  const [axisError, setAxisError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<ReviewPublic | null>(null);

  if (state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={5} />
      </div>
    );
  }
  if (state.status === 'error') {
    return <ErrorRetry message={`Gagal memuat penilaian. ${state.message}`} onRetry={reload} />;
  }

  const eligibility = state.data;

  if (submitted || eligibility.reason === 'ALREADY_SUBMITTED') {
    const review = submitted ?? eligibility.review;
    return (
      <div className="stack narrow">
        <Banner variant="success" title={copy.reviewThanks}>
          Penilaian Anda membantu mentee lain memilih mentor dengan informasi yang jujur.
        </Banner>
        {review && (
          <div className="card stack">
            <div className="review__axes">
              <span>
                {copy.reviewAxis1}: <strong>{formatRating(review.academicGuidance)}</strong>
              </span>
              <span>
                {copy.reviewAxis2}: <strong>{formatRating(review.wellBeingSupport)}</strong>
              </span>
            </div>
            {review.comment && <p>{review.comment}</p>}
            <p className="muted small">{formatDateTime(review.createdAt)}</p>
            {'status' in review && review.status === 'WITHHELD' && (
              <Banner variant="warning" title="Ulasan ditinjau">
                Ulasan Anda disimpan tetapi tidak ditampilkan karena memuat informasi pribadi.
              </Banner>
            )}
          </div>
        )}
        <Button variant="secondary" onClick={() => navigate('/booking')}>
          {copy.nav.myBookings}
        </Button>
      </div>
    );
  }

  if (!eligibility.eligible) {
    return (
      <div className="stack narrow">
        <Banner
          variant="info"
          title={
            eligibility.reason === 'NOT_COMPLETED'
              ? copy.reviewWrongBooking
              : eligibility.reason === 'NOT_YET'
                ? copy.reviewNotYet
                : copy.reviewTitle
          }
        >
          {eligibility.reason === 'NOT_YET' && eligibility.reviewEligibleAt
            ? `Penilaian terbuka ${formatDateTime(eligibility.reviewEligibleAt)}.`
            : 'Penilaian hanya tersedia untuk sesi yang sudah selesai dan berstatus selesai.'}
        </Banner>
        <Button variant="secondary" onClick={() => navigate('/booking')}>
          {copy.nav.myBookings}
        </Button>
      </div>
    );
  }

  async function submit(includeMood: boolean) {
    if (academic === null || wellBeing === null) {
      setAxisError(copy.reviewRequired);
      setStep('rating');
      return;
    }
    setAxisError(null);
    setError(null);
    setSubmitting(true);
    try {
      const result = await api<{
        review: ReviewPublic;
        bookingStatus: string;
        moodRecorded: boolean;
      }>(`/bookings/${id}/review`, {
        method: 'POST',
        body: {
          academicGuidance: academic,
          wellBeingSupport: wellBeing,
          comment: comment.trim() || undefined,
          moodCheck: includeMood && mood !== null ? { stressLevel: mood } : undefined,
        },
      });
      setSubmitted(result.review);
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'REVIEW_ALREADY_SUBMITTED'
          ? copy.reviewAlready
          : errorMessage(caught),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack stack--lg narrow">
      <nav className="breadcrumb" aria-label="Remah roti">
        <Link to="/booking">{copy.nav.myBookings}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{copy.reviewTitle}</span>
      </nav>

      {step === 'rating' ? (
        <>
          <header className="stack stack--sm">
            <h1 className="page-title">{copy.reviewTitle}</h1>
            <p className="muted">{copy.reviewSeparate}</p>
          </header>

          {error && (
            <Banner variant="danger" title={copy.reviewSendFailed}>
              {error}
            </Banner>
          )}

          <div className="card stack">
            <RatingInput
              id="academicGuidance"
              label={copy.reviewAxis1}
              help={copy.reviewAxis1Help}
              value={academic}
              onChange={setAcademic}
              disabled={submitting}
            />
            <RatingInput
              id="wellBeingSupport"
              label={copy.reviewAxis2}
              help={copy.reviewAxis2Help}
              value={wellBeing}
              onChange={setWellBeing}
              disabled={submitting}
            />

            {axisError && (
              <p className="field__error" role="alert">
                {axisError}
              </p>
            )}

            <label className="field">
              <span className="field__label">{copy.reviewCommentLabel}</span>
              <textarea
                className="input input--textarea"
                rows={4}
                maxLength={1000}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                disabled={submitting}
              />
              <span className="field__help">
                {copy.reviewCommentHelp} ({comment.length}/1000)
              </span>
            </label>

            <div className="form-actions">
              <Button
                onClick={() => {
                  if (academic === null || wellBeing === null) {
                    setAxisError(copy.reviewRequired);
                    return;
                  }
                  setAxisError(null);
                  setStep('mood');
                }}
                disabled={submitting}
              >
                {copy.next}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <>
          <header className="stack stack--sm">
            <h1 className="page-title">{copy.moodQuestion}</h1>
            <p className="muted">{copy.moodOptional}</p>
          </header>

          <Banner variant="info" title="Jawaban pribadi">
            {copy.moodPrivacy}
          </Banner>

          {error && (
            <Banner variant="danger" title={copy.moodError}>
              {error}
            </Banner>
          )}

          <div className="card stack">
            <div className="chips">
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`chip${mood === option.value ? ' chip--selected' : ''}`}
                  aria-pressed={mood === option.value}
                  onClick={() =>
                    setMood((current) => (current === option.value ? null : option.value))
                  }
                  disabled={submitting}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="review-summary">
              <div>
                <p className="muted small">{copy.reviewAxis1}</p>
                {academic !== null && <Stars value={academic} label={copy.reviewAxis1} />}
              </div>
              <div>
                <p className="muted small">{copy.reviewAxis2}</p>
                {wellBeing !== null && <Stars value={wellBeing} label={copy.reviewAxis2} />}
              </div>
            </div>

            <div className="form-actions">
              <Button
                onClick={() => void submit(true)}
                loading={submitting}
                loadingLabel="Mengirim…"
              >
                {copy.reviewCta}
              </Button>
              <Button variant="ghost" onClick={() => void submit(false)} disabled={submitting}>
                {copy.skip}
              </Button>
              <Button variant="ghost" onClick={() => setStep('rating')} disabled={submitting}>
                {copy.back}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
