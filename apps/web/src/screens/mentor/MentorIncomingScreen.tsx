import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import type { Booking } from '../../api/types';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { EmptyState, ErrorRetry } from '../../components/EmptyState';
import { StatusPill, Tabs } from '../../components/Indicators';
import { ListSkeleton } from '../../components/Skeleton';
import { copy, formatDateTime } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

const tabs = [
  { value: 'new', label: 'Baru' },
  { value: 'active', label: 'Berjalan' },
  { value: 'done', label: 'Selesai' },
  { value: 'all', label: 'Semua' },
];

function matches(booking: Booking, tab: string): boolean {
  if (tab === 'all') return true;
  if (tab === 'new') return booking.status === 'PAID';
  if (tab === 'active') return booking.status === 'SCHEDULED';
  return (
    booking.status === 'COMPLETED' ||
    booking.status === 'REVIEWED' ||
    booking.status === 'CANCELLED'
  );
}

export function MentorIncomingScreen() {
  const [tab, setTab] = useState('new');
  const { state, reload } = useApi<{ items: Booking[] }>('/bookings?role=mentor&pageSize=50');
  const [completing, setCompleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const items = state.status === 'ready' ? state.data.items : [];
  const visible = items.filter((booking) => matches(booking, tab));

  async function complete(id: string) {
    setCompleting(id);
    setError(null);
    try {
      await api(`/bookings/${id}/complete`, { method: 'POST' });
      reload();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div>
          <h1 className="page-title">Permintaan masuk</h1>
          <p className="muted">
            Catatan tingkat stres mentee tidak ditampilkan kepada mentor. Kesepakatan dibuat di
            ruang mediasi.
          </p>
        </div>
      </header>

      {error && <Banner variant="danger">{error}</Banner>}

      <Tabs items={tabs} value={tab} onChange={setTab} label="Filter permintaan" />

      {state.status === 'loading' && <ListSkeleton rows={3} />}
      {state.status === 'error' && (
        <ErrorRetry message={`Gagal memuat permintaan. ${state.message}`} onRetry={reload} />
      )}

      {state.status === 'ready' && visible.length === 0 && (
        <EmptyState
          title={copy.emptyNoRequests}
          body="Permintaan baru muncul setelah mentee membayar biaya platform."
        />
      )}

      {visible.length > 0 && (
        <ul className="booking-list">
          {visible.map((booking) => {
            const confirmed = booking.alignment?.confirmedItems ?? 0;
            const total = booking.alignment?.totalItems ?? 3;
            return (
              <li key={booking.id} className="card booking-row">
                <div className="booking-row__head">
                  <div className="booking-row__id">
                    <p className="booking-row__mentor">{booking.intakeNote.topic}</p>
                    <p className="muted small">Diajukan {formatDateTime(booking.createdAt)}</p>
                  </div>
                  <StatusPill status={booking.status} />
                </div>

                <div className="intake">
                  <p className="intake__label">Hambatan yang diceritakan mentee</p>
                  <p>{booking.intakeNote.bottleneck}</p>
                </div>

                <div className="booking-row__meta">
                  <span className="muted small">
                    Kesepakatan {confirmed}/{total} butir
                  </span>
                  {booking.scheduledAt && (
                    <span className="muted small">
                      Jadwal {formatDateTime(booking.scheduledAt)}
                    </span>
                  )}
                </div>

                <div className="booking-row__actions">
                  {(booking.status === 'PAID' ||
                    booking.status === 'SCHEDULED' ||
                    booking.status === 'COMPLETED') && (
                    <Link
                      className="btn btn--secondary btn--sm"
                      to={`/booking/${booking.id}/mediasi`}
                    >
                      Buka ruang mediasi
                    </Link>
                  )}
                  {booking.status === 'SCHEDULED' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => void complete(booking.id)}
                      loading={completing === booking.id}
                      loadingLabel="Menandai…"
                    >
                      Tandai sesi selesai
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
