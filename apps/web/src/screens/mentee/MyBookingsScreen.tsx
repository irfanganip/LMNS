import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import type { Booking, BookingStatus } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { EmptyState, ErrorRetry } from '../../components/EmptyState';
import { Avatar, StatusPill, Tabs, TierTag } from '../../components/Indicators';
import { Modal } from '../../components/Modal';
import { ListSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { copy, formatDateTime, formatRupiah } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

const tabs = [
  { value: 'all', label: 'Semua' },
  { value: 'unpaid', label: 'Belum dibayar' },
  { value: 'active', label: 'Berjalan' },
  { value: 'done', label: 'Selesai' },
];

function matchesTab(booking: Booking, tab: string): boolean {
  if (tab === 'all') return true;
  if (tab === 'unpaid')
    return booking.status === 'AWAITING_PAYMENT' || booking.status === 'PAYMENT_FAILED';
  if (tab === 'active') return booking.status === 'PAID' || booking.status === 'SCHEDULED';
  return (
    booking.status === 'COMPLETED' ||
    booking.status === 'REVIEWED' ||
    booking.status === 'CANCELLED'
  );
}

function primaryAction(
  booking: Booking,
): { label: string; to: string } | { label: string; complete: true } | null {
  switch (booking.status as BookingStatus) {
    case 'AWAITING_PAYMENT':
    case 'PAYMENT_FAILED':
      return { label: 'Bayar biaya platform', to: `/booking/${booking.id}/pembayaran` };
    case 'PAID':
      return { label: 'Lanjutkan kesepakatan', to: `/booking/${booking.id}/mediasi` };
    case 'SCHEDULED':
      return { label: 'Buka ruang mediasi', to: `/booking/${booking.id}/mediasi` };
    case 'COMPLETED':
      return { label: 'Nilai sesi', to: `/booking/${booking.id}/ulasan` };
    case 'REVIEWED':
      return { label: 'Lihat profil mentor', to: `/mentor/${booking.mentor.slug}` };
    default:
      return null;
  }
}

export function MyBookingsScreen() {
  const [tab, setTab] = useState('all');
  const { state, reload } = useApi<{ items: Booking[] }>('/bookings?role=mentee&pageSize=50');
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { session } = useSession();
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const items = state.status === 'ready' ? state.data.items : [];
  const visible = items.filter((booking) => matchesTab(booking, tab));
  const reviewPending = items.filter((booking) => booking.status === 'COMPLETED');
  const unverified = session.phase === 'authenticated' && session.me.user.emailVerifiedAt === null;

  async function cancelBooking() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await api(`/bookings/${cancelTarget.id}/cancel`, {
        method: 'POST',
        body: { reason: reason.trim() || 'Dibatalkan oleh mentee' },
      });
      showToast('Booking dibatalkan.');
      setCancelTarget(null);
      setReason('');
      reload();
    } catch (caught) {
      setCancelError(errorMessage(caught));
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div>
          <h1 className="page-title">Booking saya</h1>
          <p className="muted">Semua permintaan sesi Anda, beserta status kesepakatannya.</p>
        </div>
        <Link className="btn btn--primary btn--md" to="/">
          {copy.findMentor}
        </Link>
      </header>

      {unverified && (
        <Banner variant="warning" title="Email belum diverifikasi">
          {copy.gateUnverified} <Link to="/verifikasi">Verifikasi sekarang</Link>.
        </Banner>
      )}

      {reviewPending.length > 0 && (
        <Banner variant="info" title="Ada sesi yang menunggu penilaian">
          {reviewPending.map((booking) => (
            <span key={booking.id} className="banner__list-item">
              <Link to={`/booking/${booking.id}/ulasan`}>{booking.mentor.displayName}</Link>
            </span>
          ))}
        </Banner>
      )}

      <Tabs items={tabs} value={tab} onChange={setTab} label="Filter booking" />

      {state.status === 'loading' && <ListSkeleton rows={3} />}

      {state.status === 'error' && (
        <ErrorRetry message={`Gagal memuat booking. ${state.message}`} onRetry={reload} />
      )}

      {state.status === 'ready' && visible.length === 0 && (
        <EmptyState
          title={copy.emptyNoBookings}
          body="Ajukan sesi pertama Anda dengan mentor yang kredensialnya sudah diverifikasi."
          action={
            <Button variant="secondary" onClick={() => navigate('/')}>
              {copy.findMentor}
            </Button>
          }
        />
      )}

      {visible.length > 0 && (
        <ul className="booking-list">
          {visible.map((booking) => {
            const action = primaryAction(booking);
            const confirmed = booking.alignment?.confirmedItems;
            const total = booking.alignment?.totalItems;
            return (
              <li key={booking.id} className="card booking-row">
                <div className="booking-row__head">
                  <Avatar name={booking.mentor.displayName} size={44} />
                  <div className="booking-row__id">
                    <p className="booking-row__mentor">{booking.mentor.displayName}</p>
                    <p className="muted small">
                      {booking.intakeNote.topic} · diajukan {formatDateTime(booking.createdAt)}
                    </p>
                  </div>
                  <StatusPill status={booking.status} />
                </div>

                <div className="booking-row__meta">
                  <TierTag tier={booking.tier} label={booking.tierLabel} />
                  <span className="muted small">
                    {booking.platformFeeIdr > 0
                      ? `Biaya platform ${formatRupiah(booking.platformFeeIdr)}`
                      : 'Tanpa biaya platform'}
                  </span>
                  {typeof confirmed === 'number' && typeof total === 'number' && total > 0 && (
                    <span className="muted small">
                      Kesepakatan {confirmed}/{total} butir
                    </span>
                  )}
                  {booking.scheduledAt && (
                    <span className="muted small">
                      Jadwal {formatDateTime(booking.scheduledAt)}
                    </span>
                  )}
                </div>

                <div className="booking-row__actions">
                  {action && 'to' in action && (
                    <Link className="btn btn--secondary btn--sm" to={action.to}>
                      {action.label}
                    </Link>
                  )}
                  <Link className="btn btn--ghost btn--sm" to={`/mentor/${booking.mentor.slug}`}>
                    Profil mentor
                  </Link>
                  {(booking.status === 'AWAITING_PAYMENT' ||
                    booking.status === 'PAYMENT_FAILED' ||
                    booking.status === 'PAID' ||
                    booking.status === 'SCHEDULED') && (
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => {
                        setCancelTarget(booking);
                        setCancelError(null);
                      }}
                    >
                      Batalkan
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={cancelTarget !== null}
        title="Batalkan booking?"
        onClose={() => setCancelTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              {copy.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => void cancelBooking()}
              loading={cancelling}
              loadingLabel="Membatalkan…"
            >
              Ya, batalkan
            </Button>
          </>
        }
      >
        <p>
          Booking dengan {cancelTarget?.mentor.displayName} akan dibatalkan. Pada prototipe ini
          biaya platform tidak dikembalikan; kebijakan refund di luar cakupan.
        </p>
        {cancelError && <Banner variant="danger">{cancelError}</Banner>}
        <label className="field">
          <span className="field__label">Alasan (opsional)</span>
          <textarea
            className="input input--textarea"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={cancelling}
          />
        </label>
      </Modal>
    </div>
  );
}
