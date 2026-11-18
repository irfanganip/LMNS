import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, errorMessage } from '../../api/client';
import type { AdminApplicationDetail, ReasonTemplate } from '../../api/types';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { SelectField, TextArea } from '../../components/Field';
import { ApplicationPill, Section, TierTag } from '../../components/Indicators';
import { IconCheck, IconExternal, IconWarning } from '../../components/Icons';
import { Modal } from '../../components/Modal';
import { SkeletonLines } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { copy, formatDateTime } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

const evidenceLabels: Record<string, string> = {
  degreeUrl: 'Ijazah',
  overseasExperienceUrl: 'Pengalaman luar negeri',
  organisationUrl: 'Halaman institusi',
  googleScholarUrl: 'Google Scholar',
  linkedinUrl: 'LinkedIn',
  s3VerificationUrl: 'Verifikasi S3',
  sisterId: 'SISTER ID',
  institutionalEmailVerified: 'Email institusi terverifikasi',
  scopusId: 'Scopus ID',
  orcidId: 'ORCID',
  certificateUrl: 'Sertifikat coaching',
};

export function AdminApplicationDetailScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { state, reload } = useApi<AdminApplicationDetail>(`/admin/applications/${id}`);
  const reasons = useApi<{ items: ReasonTemplate[] }>('/admin/reasons?scope=APPLICATION');

  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [reasonCode, setReasonCode] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decided, setDecided] = useState<{ status: string; reasonText: string | null } | null>(
    null,
  );

  if (state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={8} />
      </div>
    );
  }
  if (state.status === 'error') {
    const notFound = state.error instanceof ApiError && state.error.status === 404;
    if (notFound) {
      return (
        <Banner variant="warning" title={copy.notFoundRecord}>
          <Link to="/admin/verifikasi">Kembali ke antrean</Link>
        </Banner>
      );
    }
    return <ErrorRetry message={`Gagal memuat pengajuan. ${state.message}`} onRetry={reload} />;
  }

  const detail = state.data;
  const application = detail.application;
  const existingEvidence = Object.entries(application.evidence ?? {});

  async function submitDecision() {
    if (!decision) return;
    if (decision === 'REJECT' && !reasonCode) {
      setError('Pilih alasan penolakan.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await api<{
        status: string;
        reasonText: string | null;
        mentorListed: boolean;
      }>(`/admin/applications/${id}/decision`, {
        method: 'POST',
        body: {
          decision,
          reasonCode: decision === 'APPROVE' ? 'APPROVED' : reasonCode,
          note: note.trim() || null,
        },
      });
      setDecided({ status: result.status, reasonText: result.reasonText });
      setDecision(null);
      showToast(
        decision === 'APPROVE' ? 'Pengajuan disetujui.' : 'Pengajuan ditolak dengan alasan.',
      );
      reload();
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'APPLICATION_ALREADY_DECIDED'
          ? 'Pengajuan ini sudah diputuskan oleh verifikator lain.'
          : errorMessage(caught),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack stack--lg">
      <nav className="breadcrumb" aria-label="Remah roti">
        <Link to="/admin/verifikasi">Antrean verifikasi</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Detail pengajuan</span>
      </nav>

      <header className="page-head">
        <div>
          <h1 className="page-title">{detail.mentorEmail}</h1>
          <p className="muted">
            Dikirim {formatDateTime(application.submittedAt)} ·{' '}
            {typeof detail.slaAgeHours === 'number'
              ? `${detail.slaAgeHours} jam menunggu`
              : 'belum dikirim'}
          </p>
        </div>
        <div className="page-head__meta">
          <TierTag tier={application.tier} label={application.tierLabel} />
          <ApplicationPill status={application.status} />
        </div>
      </header>

      {decided && (
        <Banner
          variant={decided.status === 'APPROVED' ? 'success' : 'warning'}
          title="Keputusan tersimpan"
        >
          {decided.reasonText ?? `Status baru: ${decided.status}.`}
        </Banner>
      )}

      {detail.flags.length > 0 && (
        <Banner variant="warning" title="Tanda dari sistem">
          <ul className="flag-list">
            {detail.flags.map((flag) => (
              <li key={flag} className="flag">
                <IconWarning size={14} /> {flag}
              </li>
            ))}
          </ul>
        </Banner>
      )}

      <div className="admin-detail">
        <div className="stack">
          <Section title="Bukti kredensial">
            <div className="card">
              {existingEvidence.length === 0 ? (
                <p className="muted">Belum ada bukti yang diunggah.</p>
              ) : (
                <ul className="evidence-list">
                  {existingEvidence.map(([key, value]) => {
                    const missing = application.missingItems.some((item) => item.key === key);
                    return (
                      <li key={key} className={missing ? 'is-missing' : ''}>
                        <span className="evidence-list__label">{evidenceLabels[key] ?? key}</span>
                        <span className="evidence-list__value">
                          {typeof value === 'boolean' ? (
                            value ? (
                              <span className="inline-ok">
                                <IconCheck size={14} /> Terverifikasi
                              </span>
                            ) : (
                              <span className="inline-warn">Belum terverifikasi</span>
                            )
                          ) : value ? (
                            /^https?:\/\//.test(String(value)) ? (
                              <a href={String(value)} target="_blank" rel="noopener noreferrer">
                                Buka bukti <IconExternal size={14} />
                                <span className="visually-hidden">(tab baru)</span>
                              </a>
                            ) : (
                              <span className="mono">{String(value)}</span>
                            )
                          ) : (
                            <span className="muted">Kosong</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}

              {application.missingItems.length > 0 && (
                <Banner variant="warning" title="Butir belum lengkap">
                  {application.missingItems.map((item) => item.label).join(', ')}
                </Banner>
              )}
            </div>
          </Section>

          <Section title="Cek domain email">
            <div className="card">
              <dl className="summary">
                <div>
                  <dt>Email</dt>
                  <dd className="mono">{detail.domainCheck.email}</dd>
                </div>
                <div>
                  <dt>Domain</dt>
                  <dd>{detail.domainCheck.domain}</dd>
                </div>
                <div>
                  <dt>Diizinkan</dt>
                  <dd>{detail.domainCheck.allowed ? 'Ya' : 'Tidak'}</dd>
                </div>
                <div>
                  <dt>Institusi</dt>
                  <dd>{detail.domainCheck.institution ?? '—'}</dd>
                </div>
              </dl>
            </div>
          </Section>

          <Section title="Asesmen diri">
            <div className="card stack">
              {application.selfAssessment ? (
                <>
                  <div>
                    <p className="prose__subhead">Filosofi</p>
                    <p>{application.selfAssessment.philosophy}</p>
                  </div>
                  <div>
                    <p className="prose__subhead">Batas peran</p>
                    <p>{application.selfAssessment.boundaries}</p>
                  </div>
                  <div>
                    <p className="prose__subhead">Pendekatan burnout</p>
                    <p>{application.selfAssessment.burnoutApproach}</p>
                  </div>
                </>
              ) : (
                <p className="muted">Belum diisi.</p>
              )}
            </div>
          </Section>

          <Section title="Etalase yang diajukan">
            <div className="card stack">
              {application.storefront ? (
                <>
                  <p className="table__primary">{application.storefront.niche}</p>
                  <p className="muted">{application.storefront.intro}</p>
                  <p className="muted small">
                    Kesejahteraan: {application.storefront.wellBeingPhilosophy}
                  </p>
                  <ul className="package-list">
                    {application.storefront.packages.map((pkg) => (
                      <li key={`${pkg.title}-${pkg.durationMinutes}`} className="package-row">
                        <div>
                          <p className="package-row__title">{pkg.title}</p>
                          <p className="muted small">{pkg.durationMinutes} menit</p>
                        </div>
                        <p className="package-row__price">
                          {pkg.isFreeConsultation
                            ? 'Gratis'
                            : `Rp ${pkg.priceIdr.toLocaleString('id-ID')}`}
                        </p>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <p className="muted">Belum ada etalase.</p>
              )}
            </div>
          </Section>
        </div>

        <aside className="stack">
          <section className="card stack" aria-labelledby="decision-title">
            <h2 className="card__title" id="decision-title">
              Keputusan
            </h2>
            {application.status === 'PENDING_REVIEW' ? (
              <>
                <Button onClick={() => setDecision('APPROVE')}>Setujui</Button>
                <Button variant="destructive" onClick={() => setDecision('REJECT')}>
                  Tolak dengan alasan
                </Button>
                <p className="muted small">
                  Penolakan wajib menyertakan alasan dari templat agar dapat disalin ke email
                  mentee.
                </p>
              </>
            ) : (
              <p className="muted">
                Pengajuan sudah diputuskan: {copy.applicationStatus[application.status]}.
                {application.decisionReasonCode && (
                  <>
                    <br />
                    Alasan: <span className="mono">{application.decisionReasonCode}</span>
                  </>
                )}
                {application.decisionNote && (
                  <>
                    <br />
                    Catatan: {application.decisionNote}
                  </>
                )}
              </p>
            )}
            <Button variant="ghost" onClick={() => navigate('/admin/verifikasi')}>
              Kembali ke antrean
            </Button>
          </section>

          <Section title="Jejak audit">
            <div className="card">
              {detail.audit.length === 0 ? (
                <p className="muted small">Belum ada tindakan.</p>
              ) : (
                <ol className="audit">
                  {detail.audit.map((event) => (
                    <li key={event.id}>
                      <p className="audit__action">{event.action}</p>
                      <p className="muted small">
                        {formatDateTime(event.createdAt)} · {event.actorId}
                      </p>
                      {event.reasonCode && <p className="muted small mono">{event.reasonCode}</p>}
                      {event.note && <p className="small">{event.note}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </Section>
        </aside>
      </div>

      <Modal
        open={decision !== null}
        title={decision === 'APPROVE' ? 'Setujui pengajuan?' : 'Tolak pengajuan'}
        onClose={() => setDecision(null)}
        dismissible={!submitting}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDecision(null)} disabled={submitting}>
              {copy.cancel}
            </Button>
            <Button
              variant={decision === 'APPROVE' ? 'primary' : 'destructive'}
              onClick={() => void submitDecision()}
              loading={submitting}
              loadingLabel="Menyimpan…"
            >
              {decision === 'APPROVE' ? 'Ya, setujui' : 'Tolak pengajuan'}
            </Button>
          </>
        }
      >
        <div className="stack">
          {error && <Banner variant="danger">{error}</Banner>}
          {decision === 'APPROVE' ? (
            <p>
              Etalase akan langsung terbit dan mentor muncul di marketplace. Pastikan seluruh bukti
              sudah diperiksa.
            </p>
          ) : (
            <>
              <SelectField
                id="reasonCode"
                label="Alasan"
                required
                value={reasonCode}
                onChange={(event) => setReasonCode(event.target.value)}
                disabled={submitting}
              >
                <option value="">Pilih alasan</option>
                {(reasons.state.status === 'ready' ? reasons.state.data.items : []).map(
                  (reason) => (
                    <option key={reason.code} value={reason.code}>
                      {reason.label}
                    </option>
                  ),
                )}
              </SelectField>
              {reasons.state.status === 'ready' && (
                <p className="muted small">
                  {reasons.state.data.items.find((item) => item.code === reasonCode)?.text}
                </p>
              )}
              <TextArea
                id="note"
                label="Catatan untuk pemohon (opsional)"
                rows={3}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                counter={`${note.length}/500`}
                disabled={submitting}
              />
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
