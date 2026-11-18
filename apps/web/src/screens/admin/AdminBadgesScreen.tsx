import { useState } from 'react';
import { ApiError, api, errorMessage } from '../../api/client';
import type { AdminMentorRow, ReasonTemplate, UpgradeAdminItem } from '../../api/types';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { EmptyState, ErrorRetry } from '../../components/EmptyState';
import { SelectField, TextArea } from '../../components/Field';
import { FilterChip, Section, Tabs, TierTag } from '../../components/Indicators';
import { Modal } from '../../components/Modal';
import { TableSkeleton } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { copy, formatDateTime } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

type BadgeAction = { mentor: AdminMentorRow; action: 'ISSUE' | 'REVOKE' };

export function AdminBadgesScreen() {
  const [tab, setTab] = useState<'mentors' | 'upgrades'>('upgrades');
  const [search, setSearch] = useState('');
  const [onlyBadged, setOnlyBadged] = useState(false);
  const mentors = useApi<{ items: AdminMentorRow[]; total: number }>(
    `/admin/mentors?${new URLSearchParams({
      ...(search ? { q: search } : {}),
      ...(onlyBadged ? { badge: 'LMNS_WELL_BEING_CERTIFIED' } : {}),
    }).toString()}`,
  );
  const upgrades = useApi<{ items: UpgradeAdminItem[]; total: number }>(
    '/admin/upgrades?status=PENDING_VERIFICATION',
  );
  const reasons = useApi<{ items: ReasonTemplate[] }>('/admin/reasons?scope=UPGRADE');
  const { showToast } = useToast();

  const [badgeAction, setBadgeAction] = useState<BadgeAction | null>(null);
  const [badgeReason, setBadgeReason] = useState('');
  const [badgeError, setBadgeError] = useState<string | null>(null);
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);

  const [upgradeTarget, setUpgradeTarget] = useState<UpgradeAdminItem | null>(null);
  const [upgradeDecision, setUpgradeDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [upgradeReason, setUpgradeReason] = useState('VERIFIED');
  const [upgradeNote, setUpgradeNote] = useState('');
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradeSubmitting, setUpgradeSubmitting] = useState(false);

  async function applyBadgeAction() {
    if (!badgeAction) return;
    if (badgeAction.action === 'REVOKE' && !badgeReason.trim()) {
      setBadgeError('Alasan pencabutan wajib diisi.');
      return;
    }
    setBadgeSubmitting(true);
    setBadgeError(null);
    try {
      await api(`/admin/mentors/${badgeAction.mentor.mentor.id}/badge`, {
        method: 'POST',
        body: { action: badgeAction.action, reason: badgeReason.trim() || null },
      });
      showToast(badgeAction.action === 'ISSUE' ? 'Badge diterbitkan.' : 'Badge dicabut.');
      setBadgeAction(null);
      setBadgeReason('');
      mentors.reload();
    } catch (caught) {
      setBadgeError(
        caught instanceof ApiError && caught.code === 'BADGE_PRECONDITIONS_UNMET'
          ? 'Syarat Premium belum lengkap untuk mentor ini.'
          : errorMessage(caught),
      );
    } finally {
      setBadgeSubmitting(false);
    }
  }

  async function submitUpgrade() {
    if (!upgradeTarget) return;
    setUpgradeSubmitting(true);
    setUpgradeError(null);
    try {
      const result = await api<{
        status: string;
        badge: { issuedAt: string } | null;
        mentorTier: string;
      }>(`/admin/upgrades/${upgradeTarget.id}/decision`, {
        method: 'POST',
        body: {
          decision: upgradeDecision,
          reasonCode: upgradeDecision === 'APPROVE' ? 'VERIFIED' : upgradeReason,
          note: upgradeNote.trim() || null,
        },
      });
      showToast(
        result.badge
          ? 'Sertifikat diverifikasi dan badge diterbitkan.'
          : `Keputusan tersimpan (${result.status}).`,
      );
      setUpgradeTarget(null);
      upgrades.reload();
      mentors.reload();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'BADGE_PRECONDITIONS_UNMET') {
        const details = caught.details as { missing?: string[] } | undefined;
        setUpgradeError(`Syarat belum lengkap: ${(details?.missing ?? []).join(', ')}`);
      } else {
        setUpgradeError(errorMessage(caught));
      }
    } finally {
      setUpgradeSubmitting(false);
    }
  }

  const upgradeItems = upgrades.state.status === 'ready' ? upgrades.state.data.items : [];

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div>
          <h1 className="page-title">Badge &amp; sertifikasi</h1>
          <p className="muted">
            Badge Well-Being terbit otomatis saat sertifikat diverifikasi dan syarat akademik sudah
            terpenuhi.
          </p>
        </div>
      </header>

      <Tabs
        items={[
          { value: 'upgrades', label: 'Permintaan premium', count: upgradeItems.length },
          {
            value: 'mentors',
            label: 'Mentor',
            count: mentors.state.status === 'ready' ? mentors.state.data.total : undefined,
          },
        ]}
        value={tab}
        onChange={(value) => setTab(value as 'mentors' | 'upgrades')}
        label="Kelola badge"
      />

      {tab === 'upgrades' && (
        <Section title="Permintaan premium menunggu verifikasi">
          {upgrades.state.status === 'loading' && <TableSkeleton rows={3} />}
          {upgrades.state.status === 'error' && (
            <ErrorRetry
              message={`Gagal memuat permintaan. ${upgrades.state.message}`}
              onRetry={upgrades.reload}
            />
          )}
          {upgrades.state.status === 'ready' && upgradeItems.length === 0 && (
            <EmptyState
              title="Tidak ada permintaan premium"
              body="Semua permintaan sudah ditangani."
            />
          )}
          {upgradeItems.length > 0 && (
            <ul className="booking-list">
              {upgradeItems.map((item) => (
                <li key={item.id} className="card stack">
                  <div className="card__head">
                    <div>
                      <p className="table__primary">{item.mentor.displayName}</p>
                      <p className="muted small">
                        Diajukan {formatDateTime(item.submittedAt)} · {item.mentor.institution}
                      </p>
                    </div>
                    <TierTag tier={item.mentor.tier} label={item.mentor.tierLabel} />
                  </div>

                  <ul className="checklist">
                    {item.checklist.map((entry) => (
                      <li
                        key={entry.key}
                        className={`checklist__item checklist__item--${entry.status.toLowerCase()}`}
                      >
                        <span className="checklist__label">{entry.label}</span>
                        <span className="checklist__detail">{entry.detail ?? entry.status}</span>
                      </li>
                    ))}
                  </ul>

                  {item.certificate && (
                    <div className="certificate">
                      <p className="certificate__file mono">{item.certificate.fileName}</p>
                      <p className="muted small">
                        Penerbit {item.certificate.issuer ?? '—'} · berlaku sampai{' '}
                        {item.certificate.expiresAt ?? '—'}
                      </p>
                    </div>
                  )}

                  <div className="form-actions">
                    <Button
                      size="sm"
                      onClick={() => {
                        setUpgradeTarget(item);
                        setUpgradeDecision('APPROVE');
                        setUpgradeReason('VERIFIED');
                        setUpgradeNote('');
                        setUpgradeError(null);
                      }}
                    >
                      Verifikasi &amp; setujui
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setUpgradeTarget(item);
                        setUpgradeDecision('REJECT');
                        setUpgradeReason('CERTIFICATE_INVALID');
                        setUpgradeNote('');
                        setUpgradeError(null);
                      }}
                    >
                      Tolak
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      {tab === 'mentors' && (
        <Section title="Mentor & badge">
          <div className="filters">
            <div className="filters__group">
              <label className="filters__label" htmlFor="mentor-search">
                Cari mentor
              </label>
              <input
                id="mentor-search"
                className="input input--compact"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Nama, email, atau institusi"
              />
            </div>
            <div className="filters__group">
              <p className="filters__label">Filter</p>
              <div className="chips">
                <FilterChip
                  label="Hanya ber-badge"
                  selected={onlyBadged}
                  onClick={() => setOnlyBadged((value) => !value)}
                />
              </div>
            </div>
          </div>

          {mentors.state.status === 'loading' && <TableSkeleton rows={4} />}
          {mentors.state.status === 'error' && (
            <ErrorRetry
              message={`Gagal memuat mentor. ${mentors.state.message}`}
              onRetry={mentors.reload}
            />
          )}
          {mentors.state.status === 'ready' && mentors.state.data.items.length === 0 && (
            <EmptyState title="Tidak ada mentor" body="Ubah kata kunci atau filter." />
          )}
          {mentors.state.status === 'ready' && mentors.state.data.items.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <caption className="visually-hidden">Daftar mentor dan badge</caption>
                <thead>
                  <tr>
                    <th scope="col">Mentor</th>
                    <th scope="col">Tier</th>
                    <th scope="col">Badge aktif</th>
                    <th scope="col">
                      <span className="visually-hidden">Aksi</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mentors.state.data.items.map((row) => {
                    const active = row.badges.filter((badge) => badge.revokedAt === null);
                    return (
                      <tr key={row.mentor.id}>
                        <td>
                          <p className="table__primary">{row.mentor.displayName}</p>
                          <p className="muted small">{row.mentor.institution}</p>
                        </td>
                        <td>
                          <TierTag tier={row.mentor.tier} label={row.mentor.tierLabel} />
                        </td>
                        <td>
                          {active.length === 0 ? (
                            <span className="muted small">Tanpa badge</span>
                          ) : (
                            <ul className="flag-list">
                              {active.map((badge) => (
                                <li key={badge.id} className="badge badge--brand">
                                  {badge.label}
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                        <td>
                          <div className="table__actions">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => {
                                setBadgeAction({ mentor: row, action: 'ISSUE' });
                                setBadgeReason('');
                                setBadgeError(null);
                              }}
                            >
                              Terbitkan
                            </Button>
                            {active.length > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setBadgeAction({ mentor: row, action: 'REVOKE' });
                                  setBadgeReason('');
                                  setBadgeError(null);
                                }}
                              >
                                Cabut
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      <Modal
        open={badgeAction !== null}
        title={badgeAction?.action === 'ISSUE' ? 'Terbitkan badge Well-Being' : 'Cabut badge'}
        onClose={() => setBadgeAction(null)}
        dismissible={!badgeSubmitting}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBadgeAction(null)} disabled={badgeSubmitting}>
              {copy.cancel}
            </Button>
            <Button
              variant={badgeAction?.action === 'ISSUE' ? 'primary' : 'destructive'}
              onClick={() => void applyBadgeAction()}
              loading={badgeSubmitting}
              loadingLabel="Menyimpan…"
            >
              {badgeAction?.action === 'ISSUE' ? 'Terbitkan' : 'Cabut badge'}
            </Button>
          </>
        }
      >
        <div className="stack">
          {badgeError && <Banner variant="danger">{badgeError}</Banner>}
          <p className="muted">
            {badgeAction?.action === 'ISSUE'
              ? 'Penerbitan hanya berhasil bila seluruh syarat Premium terverifikasi.'
              : 'Pencabutan menurunkan tier mentor ke tier terverifikasi terakhir dan tercatat di audit.'}
          </p>
          <TextArea
            id="badge-reason"
            label={badgeAction?.action === 'ISSUE' ? 'Catatan (opsional)' : 'Alasan pencabutan'}
            rows={3}
            value={badgeReason}
            onChange={(event) => setBadgeReason(event.target.value)}
            disabled={badgeSubmitting}
          />
        </div>
      </Modal>

      <Modal
        open={upgradeTarget !== null}
        title={upgradeDecision === 'APPROVE' ? 'Verifikasi sertifikat' : 'Tolak permintaan premium'}
        onClose={() => setUpgradeTarget(null)}
        dismissible={!upgradeSubmitting}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setUpgradeTarget(null)}
              disabled={upgradeSubmitting}
            >
              {copy.cancel}
            </Button>
            <Button
              variant={upgradeDecision === 'APPROVE' ? 'primary' : 'destructive'}
              onClick={() => void submitUpgrade()}
              loading={upgradeSubmitting}
              loadingLabel="Menyimpan…"
            >
              Simpan keputusan
            </Button>
          </>
        }
      >
        <div className="stack">
          {upgradeError && <Banner variant="danger">{upgradeError}</Banner>}
          {upgradeDecision === 'REJECT' && (
            <SelectField
              id="upgrade-reason"
              label="Alasan"
              value={upgradeReason}
              onChange={(event) => setUpgradeReason(event.target.value)}
              disabled={upgradeSubmitting}
            >
              {(reasons.state.status === 'ready' ? reasons.state.data.items : []).map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {reason.label}
                </option>
              ))}
              <option value="CERTIFICATE_INVALID">Sertifikat tidak valid</option>
            </SelectField>
          )}
          <TextArea
            id="upgrade-note"
            label="Catatan (opsional)"
            rows={3}
            maxLength={500}
            value={upgradeNote}
            onChange={(event) => setUpgradeNote(event.target.value)}
            counter={`${upgradeNote.length}/500`}
            disabled={upgradeSubmitting}
          />
        </div>
      </Modal>
    </div>
  );
}
