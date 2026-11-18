import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, errorMessage } from '../../api/client';
import type { Booking, BookingOptions, Payment, Receipt } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { SelectField } from '../../components/Field';
import { IconCheck, IconClose, IconInfo } from '../../components/Icons';
import { SkeletonLines } from '../../components/Skeleton';
import { copy, formatRupiah } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

type Provider = 'QRIS' | 'VIRTUAL_ACCOUNT' | 'EWALLET';

const providerLabels: Record<Provider, string> = {
  QRIS: 'QRIS',
  VIRTUAL_ACCOUNT: 'Virtual Account',
  EWALLET: 'E-wallet',
};

const providerHelp: Record<Provider, string> = {
  QRIS: 'Pindai kode QR dengan aplikasi pembayaran apa pun.',
  VIRTUAL_ACCOUNT: 'Transfer ke nomor virtual account yang ditampilkan setelah Anda menekan bayar.',
  EWALLET: 'Pilih dompet digital, lalu setujui permintaan pembayaran.',
};

export function CheckoutScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { config } = useSession();
  const booking = useApi<Booking>(`/bookings/${id}`);
  const slug = booking.state.status === 'ready' ? booking.state.data.mentor.slug : null;
  const options = useApi<BookingOptions>(slug ? `/mentors/${slug}/booking-options` : null);

  const [provider, setProvider] = useState<Provider>('QRIS');
  const [ewallet, setEwallet] = useState('GOPAY');
  const [consented, setConsented] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentError, setConsentError] = useState(false);

  if (booking.state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={6} />
      </div>
    );
  }
  if (booking.state.status === 'error') {
    return (
      <ErrorRetry
        message={`Gagal memuat booking. ${booking.state.message}`}
        onRetry={booking.reload}
      />
    );
  }

  const data = booking.state.data;
  const alreadyPaid = data.status !== 'AWAITING_PAYMENT' && data.status !== 'PAYMENT_FAILED';

  if (alreadyPaid) {
    return (
      <div className="stack narrow">
        <Banner variant="info" title="Biaya platform sudah dibayar">
          Booking ini berstatus <strong>{copy.bookingStatus[data.status]}</strong>. Lanjutkan ke
          ruang mediasi untuk menyepakati butir sesi.
        </Banner>
        <Button onClick={() => navigate(`/booking/${id}/mediasi`)}>Buka ruang mediasi</Button>
      </div>
    );
  }

  async function pay() {
    if (!consented) {
      setConsentError(true);
      return;
    }
    setConsentError(false);
    setError(null);
    setSubmitting(true);
    try {
      const payment = await api<Payment>(`/bookings/${id}/payments`, {
        method: 'POST',
        body: {
          provider,
          ewallet: provider === 'EWALLET' ? ewallet : null,
          testOutcome: simulateFailure ? 'FAILURE' : 'SUCCESS',
        },
      });
      const confirmed = await api<{ booking: Booking; payment: Payment; receipt: Receipt }>(
        `/bookings/${id}/payments/${payment.id}/confirm`,
        { method: 'POST' },
      );
      navigate(`/booking/${id}/pembayaran/status`, {
        state: { receipt: confirmed.receipt, status: confirmed.payment.status },
      });
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'CONFLICT'
          ? 'Booking ini sudah dibayar atau dibatalkan. Muat ulang halaman.'
          : errorMessage(caught),
      );
    } finally {
      setSubmitting(false);
    }
  }

  const platformFee = data.platformFeeIdr || config?.platformFeeIdr || 0;

  return (
    <div className="stack stack--lg checkout">
      <nav className="breadcrumb" aria-label="Remah roti">
        <span>Booking saya</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Pembayaran</span>
      </nav>

      <h1 className="page-title">{copy.feeTitle}</h1>

      {error && (
        <Banner variant="danger" title="Pembayaran gagal diproses">
          {error}
        </Banner>
      )}

      <div className="checkout__grid">
        <div className="stack">
          <section className="card stack" aria-labelledby="fee-detail">
            <h2 className="card__title" id="fee-detail">
              {copy.feeRow}
            </h2>
            <p className="fee-amount">{platformFee > 0 ? formatRupiah(platformFee) : 'Gratis'}</p>
            <p className="muted">{copy.feeOnce}</p>

            <ul className="check-list">
              {(
                (options.state.status === 'ready' && options.state.data.platformFeeCovers) || [
                  'Verifikasi kredensial mentor',
                  'Ruang mediasi pra-sesi',
                  'Penanganan sengketa',
                ]
              ).map((item) => (
                <li key={item}>
                  <IconCheck size={16} />
                  {item}
                </li>
              ))}
            </ul>

            <Banner variant="warning" title="Yang biaya ini bukan">
              <p>{copy.feeNotSessionFee}</p>
              <p>{copy.feeNoPromise}</p>
            </Banner>

            {options.state.status === 'ready' && (
              <p className="small">{options.state.data.sessionFeeNote}</p>
            )}
          </section>

          <section className="card stack" aria-labelledby="provider-title">
            <h2 className="card__title" id="provider-title">
              Metode pembayaran (simulasi)
            </h2>
            <p className="muted small">{copy.demoNotice}</p>
            <div className="radio-cards">
              {(Object.keys(providerLabels) as Provider[]).map((value) => (
                <label
                  key={value}
                  className={`radio-card${provider === value ? ' is-selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="provider"
                    value={value}
                    checked={provider === value}
                    onChange={() => setProvider(value)}
                    disabled={submitting}
                  />
                  <span className="radio-card__body">
                    <span className="radio-card__title">{providerLabels[value]}</span>
                    <span className="muted small">{providerHelp[value]}</span>
                  </span>
                </label>
              ))}
            </div>

            {provider === 'EWALLET' && (
              <SelectField
                id="ewallet"
                label="Dompet digital"
                value={ewallet}
                onChange={(event) => setEwallet(event.target.value)}
                disabled={submitting}
              >
                <option value="GOPAY">GoPay</option>
                <option value="OVO">OVO</option>
                <option value="DANA">DANA</option>
              </SelectField>
            )}

            <p className="muted small">{copy.feeNoCardData}</p>
          </section>

          <section className="card stack" aria-labelledby="compare-title">
            <h2 className="card__title" id="compare-title">
              Perbandingan Tier
            </h2>
            {options.state.status === 'ready' ? (
              <>
                <p className="muted small">
                  {options.state.data.comparison.currentTier ===
                  options.state.data.comparison.premiumTier
                    ? 'Mentor ini sudah Premium Educator.'
                    : `Mentor ini ${config?.tierLabels[options.state.data.comparison.currentTier] ?? 'Educator Mentor'}. Baris di bawah hanya tersedia untuk ${config?.tierLabels[options.state.data.comparison.premiumTier] ?? 'Premium Educator Mentor'}.`}
                </p>
                <ul className="compare-list">
                  {options.state.data.comparison.rows.map((row) => (
                    <li key={row.perk} className={row.included ? 'is-included' : 'is-excluded'}>
                      <span className="compare-list__icon" aria-hidden="true">
                        {row.included ? <IconCheck size={16} /> : <IconClose size={16} />}
                      </span>
                      <span className="compare-list__body">
                        <span className="compare-list__perk">{row.perk}</span>
                        <span className="muted small">
                          {row.included
                            ? 'Tersedia pada mentor ini'
                            : (row.reason ?? 'Belum tersedia')}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : options.state.status === 'error' ? (
              <ErrorRetry
                message="Perbandingan tier tidak dapat dimuat."
                onRetry={options.reload}
              />
            ) : (
              <SkeletonLines lines={4} />
            )}
          </section>
        </div>

        <aside className="card checkout__summary" aria-labelledby="summary-title">
          <h2 className="card__title" id="summary-title">
            Ringkasan
          </h2>
          <dl className="summary">
            <div>
              <dt>Mentor</dt>
              <dd>{data.mentor.displayName}</dd>
            </div>
            <div>
              <dt>Tier</dt>
              <dd>{data.tierLabel}</dd>
            </div>
            <div>
              <dt>Topik</dt>
              <dd>{data.intakeNote.topic}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{copy.bookingStatus[data.status]}</dd>
            </div>
            <div className="summary__total">
              <dt>Dibayar sekarang</dt>
              <dd>{platformFee > 0 ? formatRupiah(platformFee) : 'Gratis'}</dd>
            </div>
          </dl>

          <p className="muted small">
            <IconInfo size={14} /> {copy.feeNoPromise}
          </p>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={consented}
              onChange={(event) => {
                setConsented(event.target.checked);
                if (event.target.checked) setConsentError(false);
              }}
              disabled={submitting}
              aria-invalid={consentError || undefined}
            />
            <span>{copy.feeConsent}</span>
          </label>
          {consentError && (
            <p className="field__error" role="alert">
              {copy.feeConsentRequired}
            </p>
          )}

          <label className="checkbox checkbox--subtle">
            <input
              type="checkbox"
              checked={simulateFailure}
              onChange={(event) => setSimulateFailure(event.target.checked)}
              disabled={submitting}
            />
            <span>Simulasikan pembayaran gagal (demo)</span>
          </label>

          <Button
            onClick={() => void pay()}
            loading={submitting}
            loadingLabel="Memproses…"
            fullWidth
          >
            {copy.feeCta}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate('/booking')}
            disabled={submitting}
            fullWidth
          >
            {copy.cancel}
          </Button>
        </aside>
      </div>
    </div>
  );
}
