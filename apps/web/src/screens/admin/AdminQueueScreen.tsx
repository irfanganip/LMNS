import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminQueueItem, ApplicationStatus } from '../../api/types';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { EmptyState, ErrorRetry } from '../../components/EmptyState';
import { ApplicationPill, FilterChip, TierTag } from '../../components/Indicators';
import { TableSkeleton } from '../../components/Skeleton';
import { copy, formatDateTime } from '../../copy/id';
import { useApi } from '../../hooks/useApi';
import { buildQuery } from '../../utils/query';

type QueueResponse = {
  items: AdminQueueItem[];
  total: number;
  counts: Record<ApplicationStatus, number>;
};

export function AdminQueueScreen() {
  const [status, setStatus] = useState<ApplicationStatus>('PENDING_REVIEW');
  const [tier, setTier] = useState<string[]>([]);
  const [sort, setSort] = useState<'slaAge' | 'submittedAt'>('slaAge');

  const query = useMemo(
    () => buildQuery({ status, tier, sort, pageSize: 50 }),
    [status, tier, sort],
  );
  const { state, reload } = useApi<QueueResponse>(`/admin/applications${query}`);

  const counts = state.status === 'ready' ? state.data.counts : null;
  const items = state.status === 'ready' ? state.data.items : [];

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div>
          <h1 className="page-title">Antrean verifikasi</h1>
          <p className="muted">
            Keputusan tercatat di jejak audit beserta alasannya. Tanda merah dihitung server, bukan
            diturunkan dari tampilan.
          </p>
        </div>
      </header>

      <div className="tiles">
        {(['PENDING_REVIEW', 'APPROVED', 'REJECTED'] as ApplicationStatus[]).map((key) => (
          <button
            key={key}
            type="button"
            className={`tile${status === key ? ' tile--active' : ''}`}
            onClick={() => setStatus(key)}
            aria-pressed={status === key}
          >
            <span className="tile__label">{copy.applicationStatus[key]}</span>
            <span className="tile__value">{counts ? (counts[key] ?? 0) : '—'}</span>
          </button>
        ))}
      </div>

      <section className="filters" aria-label="Filter antrean">
        <div className="filters__group">
          <p className="filters__label">Tier</p>
          <div className="chips">
            {(['BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM'] as const).map((value) => (
              <FilterChip
                key={value}
                label={
                  value === 'BASIC'
                    ? 'Basic Mentor'
                    : value === 'EDUCATOR_STANDARD'
                      ? 'Educator Mentor'
                      : 'Premium Educator Mentor'
                }
                selected={tier.includes(value)}
                onClick={() =>
                  setTier((current) =>
                    current.includes(value)
                      ? current.filter((item) => item !== value)
                      : [...current, value],
                  )
                }
              />
            ))}
          </div>
        </div>
        <div className="filters__group">
          <p className="filters__label">Urutkan</p>
          <div className="chips">
            <FilterChip
              label="Menunggu terlama"
              selected={sort === 'slaAge'}
              onClick={() => setSort('slaAge')}
            />
            <FilterChip
              label="Terbaru"
              selected={sort === 'submittedAt'}
              onClick={() => setSort('submittedAt')}
            />
          </div>
        </div>
      </section>

      {state.status === 'error' && (
        <ErrorRetry message={`Gagal memuat antrean. ${state.message}`} onRetry={reload} />
      )}

      {state.status === 'ready' && items.length === 0 && (
        <EmptyState
          title={copy.emptyQueueClear}
          body={
            status === 'PENDING_REVIEW'
              ? copy.emptyQueueClearBody
              : 'Tidak ada pengajuan pada filter ini.'
          }
          action={
            status !== 'PENDING_REVIEW' ? (
              <Button variant="secondary" onClick={() => setStatus('PENDING_REVIEW')}>
                Lihat antrean aktif
              </Button>
            ) : undefined
          }
        />
      )}

      {state.status === 'loading' && <TableSkeleton rows={5} />}

      {items.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <caption className="visually-hidden">Antrean pengajuan mentor</caption>
            <thead>
              <tr>
                <th scope="col">Pemohon</th>
                <th scope="col">Tier</th>
                <th scope="col">Status</th>
                <th scope="col">Dikirim</th>
                <th scope="col">Tanda</th>
                <th scope="col">
                  <span className="visually-hidden">Aksi</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.application.id}>
                  <td>
                    <p className="table__primary">{item.application.mentorId}</p>
                    <p className="muted small mono">{item.mentorEmail}</p>
                  </td>
                  <td>
                    <TierTag tier={item.application.tier} label={item.application.tierLabel} />
                  </td>
                  <td>
                    <ApplicationPill status={item.application.status} />
                  </td>
                  <td>
                    {item.application.submittedAt ? (
                      <>
                        <p>{formatDateTime(item.application.submittedAt)}</p>
                        {typeof item.slaAgeHours === 'number' && (
                          <p className="muted small">{item.slaAgeHours} jam menunggu</p>
                        )}
                      </>
                    ) : (
                      <span className="muted">Belum dikirim</span>
                    )}
                  </td>
                  <td>
                    {item.flags.length > 0 ? (
                      <ul className="flag-list">
                        {item.flags.map((flag) => (
                          <li key={flag} className="flag">
                            {flag}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="muted small">—</span>
                    )}
                  </td>
                  <td>
                    <Link
                      className="btn btn--secondary btn--sm"
                      to={`/admin/verifikasi/${item.application.id}`}
                    >
                      Tinjau
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {state.status === 'ready' && items.length > 0 && (
        <Banner variant="info" title="Perkiraan SLA">
          Keputusan diharapkan dalam 3 hari kerja sejak pengajuan dikirim.
        </Banner>
      )}
    </div>
  );
}
