import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import type { Booking, MentorDashboard } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import {
  ApplicationPill,
  Section,
  StatusPill,
  TierTag,
  TrustBadge,
} from '../../components/Indicators';
import { SkeletonLines } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { copy, formatDateTime } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

export function MentorDashboardScreen() {
  const { session } = useSession();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const dashboard = useApi<MentorDashboard>('/mentor/dashboard');
  const bookings = useApi<{ items: Booking[] }>('/bookings?role=mentor&pageSize=20');

  if (dashboard.state.status === 'loading') {
    return (
      <div className="stack">
        <div className="card">
          <SkeletonLines lines={3} />
        </div>
        <div className="grid grid--stats">
          {[0, 1, 2].map((key) => (
            <div className="card" key={key}>
              <SkeletonLines lines={2} />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (dashboard.state.status === 'error') {
    return (
      <ErrorRetry
        message={`Gagal memuat dasbor. ${dashboard.state.message}`}
        onRetry={dashboard.reload}
      />
    );
  }

  const data = dashboard.state.data;
  const application = data.application;
  const mentor = data.mentor;
  const incoming = bookings.state.status === 'ready' ? bookings.state.data.items : [];
  const awaitingPayment = incoming.filter((booking) => booking.status === 'PAID').length;

  async function withdraw() {
    if (!application) return;
    try {
      await api(`/mentor/applications/${application.id}/withdraw`, { method: 'POST' });
      showToast('Pengajuan ditarik.');
      dashboard.reload();
    } catch (error) {
      showToast(errorMessage(error), 'error');
    }
  }

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div>
          <h1 className="page-title">
            {session.phase === 'authenticated' ? session.me.user.email : 'Dasbor mentor'}
          </h1>
          <p className="muted">Status pengajuan, etalase, dan permintaan sesi Anda.</p>
        </div>
        {mentor && <TierTag tier={mentor.tier} label={mentor.tierLabel} />}
      </header>

      {!application && (
        <section className="card stack">
          <h2 className="card__title">Mulai pengajuan mentor</h2>
          <p className="muted">
            Pengajuan terdiri dari tiga langkah: identitas & bukti, asesmen diri, lalu etalase.
            Verifikasi dilakukan manusia; keputusan biasanya dalam 2–3 hari kerja.
          </p>
          <Button onClick={() => navigate('/mentor/pengajuan/1')}>Mulai pengajuan</Button>
        </section>
      )}

      {application && application.status === 'DRAFT' && (
        <section className="card stack">
          <div className="card__head">
            <h2 className="card__title">Lanjutkan pengajuan</h2>
            <ApplicationPill status={application.status} />
          </div>
          <p className="muted">
            Langkah terakhir Anda:{' '}
            {application.currentStep === 'IDENTITY'
              ? 'identitas & bukti'
              : application.currentStep === 'SELF_ASSESSMENT'
                ? 'asesmen diri'
                : 'etalase'}
            .
          </p>
          {application.missingItems.length > 0 && (
            <Banner
              variant="warning"
              title={`${application.missingItems.length} butir belum lengkap`}
            >
              {application.missingItems.map((item) => item.label).join(', ')}
            </Banner>
          )}
          <Button
            onClick={() =>
              navigate(
                application.currentStep === 'IDENTITY'
                  ? '/mentor/pengajuan/1'
                  : application.currentStep === 'SELF_ASSESSMENT'
                    ? '/mentor/pengajuan/2'
                    : '/mentor/pengajuan/3',
              )
            }
          >
            Lanjutkan
          </Button>
        </section>
      )}

      {application && application.status === 'PENDING_REVIEW' && (
        <section className="card stack">
          <div className="card__head">
            <h2 className="card__title">{copy.reviewPendingTitle}</h2>
            <ApplicationPill status={application.status} />
          </div>
          <p className="muted">{copy.reviewPendingBody}</p>
          <dl className="summary">
            <div>
              <dt>Dikirim</dt>
              <dd>{formatDateTime(application.submittedAt)}</dd>
            </div>
            <div>
              <dt>Perkiraan keputusan</dt>
              <dd>{formatDateTime(application.slaDueAt)}</dd>
            </div>
            <div>
              <dt>Tier diajukan</dt>
              <dd>{application.tierLabel}</dd>
            </div>
          </dl>
          <div className="form-actions">
            <Button variant="secondary" onClick={() => void withdraw()}>
              Tarik pengajuan
            </Button>
          </div>
        </section>
      )}

      {application && application.status === 'REJECTED' && (
        <Banner
          variant="warning"
          title={copy.rejectBannerTitle}
          action={
            <Button size="sm" variant="secondary" onClick={() => navigate('/mentor/pengajuan/1')}>
              {copy.rejectCta}
            </Button>
          }
        >
          {application.decisionNote ?? copy.rejectBannerBody}
        </Banner>
      )}

      {mentor && application?.status === 'APPROVED' && (
        <>
          <section className="grid grid--stats">
            <div className="card stat">
              <p className="stat__label">Sesi mendatang</p>
              <p className="stat__value">{data.stats.upcomingBookings}</p>
            </div>
            <div className="card stat">
              <p className="stat__label">Kesepakatan belum tuntas</p>
              <p className="stat__value">{data.stats.pendingAgreements}</p>
            </div>
            <div className="card stat">
              <p className="stat__label">Sesi selesai</p>
              <p className="stat__value">{data.stats.completedSessions}</p>
            </div>
          </section>

          <Section
            title="Etalase publik Anda"
            action={
              <Link className="btn btn--secondary btn--sm" to="/mentor/studio">
                Ubah etalase
              </Link>
            }
          >
            <div className="card stack">
              <div className="mentor-mini">
                <div>
                  <p className="mentor-mini__name">{mentor.displayName}</p>
                  <p className="muted small">
                    {mentor.academicTitle} · {mentor.institution}
                  </p>
                </div>
                <TierTag tier={mentor.tier} label={mentor.tierLabel} />
              </div>
              {mentor.badges.length > 0 ? (
                <ul className="mentor-card__badges">
                  {mentor.badges.map((badge) => (
                    <li key={badge.type}>
                      <TrustBadge badge={badge} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted small">Belum ada penanda terverifikasi.</p>
              )}
              <div className="form-actions">
                <Link className="btn btn--ghost btn--sm" to={`/mentor/${mentor.slug}`}>
                  Lihat halaman publik
                </Link>
              </div>
            </div>
          </Section>

          {data.upgrade && (
            <Section
              title="Premium Educator"
              action={
                <Link className="btn btn--secondary btn--sm" to="/mentor/premium">
                  {data.upgrade.currentTier === 'EDUCATOR_PREMIUM'
                    ? 'Lihat status'
                    : 'Lihat jalur upgrade'}
                </Link>
              }
            >
              <div className="card">
                {data.upgrade.currentTier === 'EDUCATOR_PREMIUM' ? (
                  <p>Sertifikasi Well-Being LMNS Anda aktif. Badge tampil di kartu dan profil.</p>
                ) : (
                  <ul className="checklist">
                    {data.upgrade.checklist.map((item) => (
                      <li
                        key={item.key}
                        className={`checklist__item checklist__item--${item.status.toLowerCase()}`}
                      >
                        <span className="checklist__label">{item.label}</span>
                        <span className="checklist__detail">{item.detail ?? item.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Section>
          )}
        </>
      )}

      <Section
        title="Permintaan masuk"
        action={
          <Link className="btn btn--secondary btn--sm" to="/mentor/permintaan">
            Lihat semua
          </Link>
        }
      >
        {bookings.state.status === 'loading' && <SkeletonLines lines={3} />}
        {bookings.state.status === 'error' && (
          <ErrorRetry
            message={`Gagal memuat permintaan. ${bookings.state.message}`}
            onRetry={bookings.reload}
          />
        )}
        {bookings.state.status === 'ready' && incoming.length === 0 && (
          <div className="card">
            <p className="muted">{copy.emptyNoRequests}</p>
          </div>
        )}
        {incoming.length > 0 && (
          <ul className="booking-list">
            {incoming.slice(0, 3).map((booking) => (
              <li key={booking.id} className="card booking-row">
                <div className="booking-row__head">
                  <div className="booking-row__id">
                    <p className="booking-row__mentor">{booking.intakeNote.topic}</p>
                    <p className="muted small">
                      Diajukan {formatDateTime(booking.createdAt)} · kesepakatan{' '}
                      {booking.alignment?.confirmedItems ?? 0}/{booking.alignment?.totalItems ?? 3}
                    </p>
                  </div>
                  <StatusPill status={booking.status} />
                </div>
                {(booking.status === 'PAID' || booking.status === 'SCHEDULED') && (
                  <div className="booking-row__actions">
                    <Link
                      className="btn btn--secondary btn--sm"
                      to={`/booking/${booking.id}/mediasi`}
                    >
                      Buka ruang mediasi
                    </Link>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        {awaitingPayment > 0 && (
          <p className="muted small">
            {awaitingPayment} permintaan sudah membayar biaya platform dan menunggu kesepakatan.
          </p>
        )}
      </Section>
    </div>
  );
}
