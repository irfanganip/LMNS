import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, errorMessage, fieldErrors } from '../../api/client';
import type { Booking, BookingOptions, Payment } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { TextArea, TextField } from '../../components/Field';
import { Avatar, TierTag } from '../../components/Indicators';
import { SkeletonLines } from '../../components/Skeleton';
import { copy, formatRupiah } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

const sessionFeeCopy: Record<BookingOptions['sessionFeeBasis'], string> = {
  RP_0: 'Sesi ini tidak dipungut honor. Biaya platform tetap berlaku.',
  AGREED_IN_MEDIATION:
    'Honor sesi disepakati bersama mentor di ruang mediasi, dibayar langsung ke mentor.',
  PACKAGE_PRICE: 'Honor sesi mengikuti harga paket yang Anda pilih, dibayar langsung ke mentor.',
};

export function BookingRequestScreen() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const { state, reload } = useApi<BookingOptions>(`/mentors/${slug}/booking-options`);

  const [topic, setTopic] = useState('');
  const [bottleneck, setBottleneck] = useState('');
  const [stressLevel, setStressLevel] = useState<number | null>(null);
  const [packageId, setPackageId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existingBookingId, setExistingBookingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const verified =
    session.phase === 'authenticated' ? session.me.user.emailVerifiedAt !== null : false;
  const options = state.status === 'ready' ? state.data : null;
  const selectedPackage = options?.packages.find((pkg) => pkg.id === packageId) ?? null;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!options) return;
    setError(null);
    setExistingBookingId(null);
    const next: Record<string, string> = {};
    if (!topic.trim()) next.topic = 'Tuliskan topik yang ingin dibahas.';
    if (!bottleneck.trim()) next.bottleneck = 'Ceritakan hambatan Anda.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      const result = await api<{ booking: Booking; payment: Payment }>('/bookings', {
        method: 'POST',
        body: {
          mentorId: options.mentor.id,
          packageId: packageId || null,
          intakeNote: {
            topic: topic.trim(),
            bottleneck: bottleneck.trim(),
            stressLevel,
          },
        },
      });
      navigate(`/booking/${result.booking.id}/pembayaran`);
    } catch (caught) {
      setErrors(fieldErrors(caught));
      if (caught instanceof ApiError && caught.status === 409) {
        const details = caught.details as { existingBookingId?: string } | undefined;
        setExistingBookingId(details?.existingBookingId ?? null);
      }
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  if (state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={5} />
      </div>
    );
  }

  if (state.status === 'error') {
    return <ErrorRetry message={`Gagal memuat opsi sesi. ${state.message}`} onRetry={reload} />;
  }

  if (!verified) {
    return (
      <div className="stack narrow">
        <Banner variant="warning" title="Verifikasi email diperlukan">
          {copy.gateUnverified}
        </Banner>
        <Button variant="secondary" onClick={() => navigate('/verifikasi')}>
          Verifikasi sekarang
        </Button>
      </div>
    );
  }

  if (!options) return null;

  return (
    <div className="stack stack--lg narrow">
      <nav className="breadcrumb" aria-label="Remah roti">
        <Link to={`/mentor/${slug}`}>Profil mentor</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Ajukan sesi</span>
      </nav>

      <header className="stack stack--sm">
        <h1 className="page-title">Ajukan sesi</h1>
        <p className="muted">
          Catatan ini membantu mentor menyiapkan sesi. Tingkat stres hanya terlihat oleh Anda dan
          admin, tidak oleh mentor.
        </p>
      </header>

      <div className="card mentor-mini">
        <Avatar name={options.mentor.displayName} size={48} />
        <div>
          <p className="mentor-mini__name">{options.mentor.displayName}</p>
          <p className="muted small">
            {options.mentor.academicTitle} · {options.mentor.institution}
          </p>
        </div>
        <TierTag tier={options.mentor.tier} label={options.mentor.tierLabel} />
      </div>

      {error && (
        <Banner variant="danger" title="Permintaan belum terkirim">
          {error}
          {existingBookingId && (
            <>
              {' '}
              <Link to={`/booking/${existingBookingId}/pembayaran`}>
                Buka booking yang masih terbuka
              </Link>
              .
            </>
          )}
        </Banner>
      )}

      <form className="card stack" onSubmit={(event) => void onSubmit(event)} noValidate>
        {options.packages.length > 0 && (
          <fieldset className="field">
            <legend className="field__label">Paket sesi</legend>
            <div className="radio-cards">
              {options.packages.map((pkg) => (
                <label
                  key={pkg.id}
                  className={`radio-card${packageId === pkg.id ? ' is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="packageId"
                    value={pkg.id}
                    checked={packageId === pkg.id}
                    onChange={() => setPackageId(pkg.id)}
                    disabled={submitting}
                  />
                  <span className="radio-card__body">
                    <span className="radio-card__title">{pkg.title}</span>
                    <span className="muted small">{pkg.description}</span>
                    <span className="muted small">{pkg.durationMinutes} menit</span>
                  </span>
                  <span className="radio-card__price">
                    {pkg.isFreeConsultation ? 'Gratis' : formatRupiah(pkg.priceIdr)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <TextField
          id="topic"
          label="Topik yang ingin dibahas"
          required
          maxLength={200}
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          error={errors.topic}
          help="Maksimal 200 karakter."
          disabled={submitting}
        />

        <TextArea
          id="bottleneck"
          label="Hambatan saat ini"
          required
          rows={4}
          maxLength={500}
          value={bottleneck}
          onChange={(event) => setBottleneck(event.target.value)}
          error={errors.bottleneck}
          help="Maksimal 500 karakter."
          disabled={submitting}
        />

        <fieldset className="field">
          <legend className="field__label">Tingkat beban saat ini (opsional)</legend>
          <p className="field__help">{copy.privacyPulse}</p>
          <div className="chips">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                type="button"
                className={`chip${stressLevel === level ? ' chip--selected' : ''}`}
                aria-pressed={stressLevel === level}
                onClick={() => setStressLevel((current) => (current === level ? null : level))}
                disabled={submitting}
              >
                {level}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="fee-note">
          <p className="fee-note__title">
            {options.platformFeeIdr > 0
              ? `Biaya platform ${formatRupiah(options.platformFeeIdr)}`
              : 'Biaya platform tidak dikenakan'}
          </p>
          <p className="muted small">
            {sessionFeeCopy[options.sessionFeeBasis]} {options.sessionFeeNote}
          </p>
          {selectedPackage && (
            <p className="muted small">
              Paket dipilih: {selectedPackage.title} ·{' '}
              {selectedPackage.isFreeConsultation
                ? 'gratis'
                : formatRupiah(selectedPackage.priceIdr)}
            </p>
          )}
        </div>

        <div className="form-actions">
          <Button type="submit" loading={submitting} loadingLabel="Mengirim permintaan…">
            Lanjut ke pembayaran
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate(`/mentor/${slug}`)}>
            {copy.cancel}
          </Button>
        </div>
      </form>
    </div>
  );
}
