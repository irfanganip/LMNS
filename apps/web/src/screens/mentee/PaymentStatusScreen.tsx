import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import type { Booking, Receipt } from '../../api/types';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { IconCheckCircle, IconClock, IconError } from '../../components/Icons';
import { SkeletonLines } from '../../components/Skeleton';
import { copy, formatDateTime, formatRupiah } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

export function PaymentStatusScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const booking = useApi<Booking>(`/bookings/${id}`);
  const receipt = useApi<Receipt>(`/bookings/${id}/receipt`);

  if (booking.state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={5} />
      </div>
    );
  }
  if (booking.state.status === 'error') {
    return (
      <ErrorRetry
        message={`Gagal memuat status pembayaran. ${booking.state.message}`}
        onRetry={booking.reload}
      />
    );
  }

  const data = booking.state.data;
  const paid = data.paymentStatus === 'SUCCEEDED';
  const failed = data.paymentStatus === 'FAILED' || data.status === 'PAYMENT_FAILED';
  const receiptUnavailable =
    receipt.state.status === 'error' && receipt.state.error instanceof ApiError;

  return (
    <div className="stack stack--lg narrow">
      {paid && (
        <section className="card status-hero status-hero--success">
          <span className="status-hero__icon">
            <IconCheckCircle size={40} />
          </span>
          <h1 className="status-hero__title">Biaya platform diterima</h1>
          <p className="muted">
            {copy.feeOnce} Ruang mediasi sudah dibuka untuk Anda dan {data.mentor.displayName}.
          </p>
          <div className="form-actions">
            <Button onClick={() => navigate(`/booking/${id}/mediasi`)}>Buka ruang mediasi</Button>
            <Link className="btn btn--ghost btn--md" to="/booking">
              {copy.nav.myBookings}
            </Link>
          </div>
        </section>
      )}

      {failed && (
        <section className="card status-hero status-hero--danger">
          <span className="status-hero__icon">
            <IconError size={40} />
          </span>
          <h1 className="status-hero__title">Pembayaran belum berhasil</h1>
          <p className="muted">
            Tidak ada dana yang berpindah pada prototipe ini. Booking Anda tetap tersimpan dan bisa
            dibayar ulang.
          </p>
          <div className="form-actions">
            <Button onClick={() => navigate(`/booking/${id}/pembayaran`)}>Coba bayar lagi</Button>
            <Link className="btn btn--ghost btn--md" to="/booking">
              {copy.nav.myBookings}
            </Link>
          </div>
        </section>
      )}

      {!paid && !failed && (
        <section className="card status-hero">
          <span className="status-hero__icon">
            <IconClock size={40} />
          </span>
          <h1 className="status-hero__title">Menunggu konfirmasi gateway</h1>
          <p className="muted">
            Status pembayaran belum final. Muat ulang halaman ini beberapa saat lagi.
          </p>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => void booking.reload()}>
              Muat ulang
            </Button>
          </div>
        </section>
      )}

      <section className="card stack" aria-labelledby="receipt-title">
        <h2 className="card__title" id="receipt-title">
          Kuitansi biaya platform
        </h2>
        {receipt.state.status === 'ready' ? (
          <>
            <dl className="summary">
              <div>
                <dt>Nomor kuitansi</dt>
                <dd className="mono">{receipt.state.data.receiptNumber}</dd>
              </div>
              <div>
                <dt>Diterbitkan</dt>
                <dd>{formatDateTime(receipt.state.data.issuedAt ?? receipt.state.data.paidAt)}</dd>
              </div>
              <div className="summary__total">
                <dt>{copy.feeRow}</dt>
                <dd>{formatRupiah(receipt.state.data.platformFeeIdr)}</dd>
              </div>
            </dl>
            <ul className="check-list">
              {(receipt.state.data.covers ?? []).map((item) => (
                <li key={item}>
                  <IconCheckCircle size={16} />
                  {item}
                </li>
              ))}
            </ul>
            {receipt.state.data.disclaimer && (
              <Banner variant="info">{receipt.state.data.disclaimer}</Banner>
            )}
          </>
        ) : receiptUnavailable ? (
          <p className="muted">{copy.feeNotSessionFee}</p>
        ) : (
          <SkeletonLines lines={3} />
        )}
      </section>

      <p className="muted small">{copy.demoNotice}</p>
    </div>
  );
}
