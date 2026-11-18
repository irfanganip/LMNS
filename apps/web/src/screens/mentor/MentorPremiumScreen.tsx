import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, errorMessage } from '../../api/client';
import type {
  Certificate,
  TrainingModule,
  TrainingModuleDetail,
  UpgradeStatus,
} from '../../api/types';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { TextField } from '../../components/Field';
import { IconCheck, IconClose } from '../../components/Icons';
import { Modal } from '../../components/Modal';
import { SkeletonLines } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { copy, formatDateTime } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

const assessmentItems = [
  {
    questionId: 'q1',
    prompt:
      'Seorang mentee menulis bahwa ia tidak sanggup melanjutkan skripsi dan merasa putus asa. Apa langkah pertama Anda?',
    choices: [
      'Memberi target tenggat baru agar ia tetap termotivasi',
      'Mendengarkan, memvalidasi perasaannya, lalu menanyakan keselamatan dan dukungan yang ia miliki',
      'Menasihatinya agar beristirahat lebih banyak',
    ],
  },
  {
    questionId: 'q2',
    prompt: 'Apa batas peran mentor LMNS terhadap kondisi kesehatan mental mentee?',
    choices: [
      'Mentor boleh memberi diagnosis awal agar sesi lebih terarah',
      'Mentor tidak menangani kondisi klinis dan merujuk ke layanan profesional',
      'Mentor menggantikan konselor kampus selama masa bimbingan',
    ],
  },
];

export function MentorPremiumScreen() {
  const { state, reload } = useApi<UpgradeStatus>('/mentor/upgrade');
  const modules = useApi<{ items: TrainingModule[]; total: number }>('/training/modules');
  const { showToast } = useToast();

  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [assessmentResult, setAssessmentResult] = useState<{
    score: number;
    passed: boolean;
    attemptsRemaining: number;
    retakeAvailableAt?: string | null;
  } | null>(null);
  const [submittingAssessment, setSubmittingAssessment] = useState(false);
  const [assessmentError, setAssessmentError] = useState<string | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);

  const [fileName, setFileName] = useState('');
  const [issuer, setIssuer] = useState('LMNS');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [missing, setMissing] = useState<string[]>([]);

  if (state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={6} />
      </div>
    );
  }
  if (state.status === 'error') {
    return (
      <ErrorRetry message={`Gagal memuat status premium. ${state.message}`} onRetry={reload} />
    );
  }

  const upgrade = state.data;
  const isPremium = upgrade.currentTier === 'EDUCATOR_PREMIUM';
  const assessmentDone = upgrade.assessment.passed;
  const canRetake = (upgrade.assessment.attemptsRemaining ?? 0) > 0;

  async function completeModule(id: string) {
    try {
      await api(`/training/modules/${id}/complete`, { method: 'POST' });
      setActiveModule(null);
      modules.reload();
      reload();
      showToast('Modul ditandai selesai.');
    } catch (error) {
      showToast(errorMessage(error), 'error');
    }
  }

  async function submitAssessment() {
    setAssessmentError(null);
    setSubmittingAssessment(true);
    try {
      const result = await api<{
        score: number;
        passed: boolean;
        attemptsUsed: number;
        attemptsRemaining: number;
        retakeAvailableAt: string | null;
      }>('/mentor/upgrade/assessment', {
        method: 'POST',
        body: {
          answers: Object.entries(answers).map(([questionId, choice]) => ({ questionId, choice })),
        },
      });
      setAssessmentResult(result);
      setShowAssessment(false);
      reload();
    } catch (caught) {
      setAssessmentError(
        caught instanceof ApiError && caught.code === 'TRAINING_INCOMPLETE'
          ? 'Selesaikan semua modul pelatihan terlebih dahulu.'
          : errorMessage(caught),
      );
    } finally {
      setSubmittingAssessment(false);
    }
  }

  async function uploadCertificate() {
    setUploadError(null);
    setUploading(true);
    try {
      const result = await api<Certificate>('/mentor/upgrade/certificate', {
        method: 'POST',
        body: {
          fileName: fileName.trim(),
          issuer: issuer.trim() || undefined,
          issuedAt: issuedAt || undefined,
          expiresAt: expiresAt || undefined,
        },
      });
      setCertificate(result);
      reload();
      showToast('Sertifikat dikirim untuk diverifikasi.');
    } catch (caught) {
      setUploadError(errorMessage(caught));
    } finally {
      setUploading(false);
    }
  }

  async function submitUpgrade() {
    setSubmitError(null);
    setMissing([]);
    setSubmitting(true);
    try {
      await api('/mentor/upgrade/submit', { method: 'POST' });
      showToast('Permintaan upgrade dikirim ke admin.');
      reload();
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'BADGE_PRECONDITIONS_UNMET') {
        const details = caught.details as { missing?: string[] } | undefined;
        setMissing(details?.missing ?? []);
      }
      setSubmitError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div>
          <h1 className="page-title">Premium Educator</h1>
          <p className="muted">
            Sertifikasi Well-Being LMNS: pelatihan, asesmen pemahaman, dan verifikasi sertifikat
            oleh admin.
          </p>
        </div>
        <span className={`badge badge--${isPremium ? 'brand' : 'muted'}`}>
          {isPremium ? 'Sertifikasi aktif' : 'Belum tersertifikasi'}
        </span>
      </header>

      {isPremium && (
        <Banner variant="success" title="Anda Premium Educator">
          Badge dan manfaat Premium tampil di kartu serta profil publik Anda.
        </Banner>
      )}

      <section className="card stack" aria-labelledby="checklist-title">
        <h2 className="card__title" id="checklist-title">
          Daftar syarat
        </h2>
        <ul className="checklist">
          {upgrade.checklist.map((item) => (
            <li
              key={item.key}
              className={`checklist__item checklist__item--${item.status.toLowerCase()}`}
            >
              <span className="checklist__icon" aria-hidden="true">
                {item.status === 'VERIFIED' ? (
                  <IconCheck size={16} />
                ) : item.status === 'REJECTED' ? (
                  <IconClose size={16} />
                ) : (
                  <span className="checklist__dot" />
                )}
              </span>
              <span className="checklist__label">{item.label}</span>
              <span className="checklist__detail">
                {item.detail ?? labelForStatus(item.status)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="card stack" aria-labelledby="training-title">
        <div className="card__head">
          <h2 className="card__title" id="training-title">
            Pelatihan
          </h2>
          {modules.state.status === 'ready' && (
            <span className="muted small">
              {modules.state.data.items.filter((item) => item.completed).length}/
              {modules.state.data.total} modul selesai
            </span>
          )}
        </div>
        {modules.state.status === 'loading' && <SkeletonLines lines={4} />}
        {modules.state.status === 'error' && (
          <ErrorRetry message="Gagal memuat modul pelatihan." onRetry={modules.reload} />
        )}
        {modules.state.status === 'ready' && (
          <ul className="module-list">
            {modules.state.data.items.map((module) => (
              <li key={module.id} className={`module${module.completed ? ' is-done' : ''}`}>
                <span className="module__check" aria-hidden="true">
                  {module.completed ? <IconCheck size={16} /> : <span className="checklist__dot" />}
                </span>
                <div className="module__body">
                  <p className="module__title">{module.title}</p>
                  <p className="muted small">{module.durationMinutes} menit</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setActiveModule(module.id)}>
                  {module.completed ? 'Buka' : 'Mulai'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card stack" aria-labelledby="assessment-title">
        <h2 className="card__title" id="assessment-title">
          Asesmen pemahaman
        </h2>
        <p className="muted small">
          Sisa percobaan: {upgrade.assessment.attemptsRemaining}. Nilai minimum 70.
        </p>
        {assessmentResult && (
          <Banner
            variant={assessmentResult.passed ? 'success' : 'warning'}
            title={assessmentResult.passed ? 'Asesmen lulus' : 'Asesmen belum lulus'}
          >
            Skor {assessmentResult.score}.{' '}
            {assessmentResult.passed
              ? 'Lanjutkan ke verifikasi sertifikat.'
              : assessmentResult.retakeAvailableAt
                ? `Percobaan berikutnya ${formatDateTime(assessmentResult.retakeAvailableAt)}.`
                : 'Anda dapat mencoba lagi.'}
          </Banner>
        )}
        {assessmentError && <Banner variant="danger">{assessmentError}</Banner>}
        {!isPremium && (
          <div className="form-actions">
            <Button
              variant={assessmentDone ? 'secondary' : 'primary'}
              disabled={!canRetake || assessmentDone || modules.state.status !== 'ready'}
              onClick={() => setShowAssessment(true)}
            >
              {assessmentDone ? 'Sudah lulus' : 'Mulai asesmen'}
            </Button>
            {!canRetake && <span className="muted small">Batas percobaan harian tercapai.</span>}
          </div>
        )}
      </section>

      <section className="card stack" aria-labelledby="certificate-title">
        <h2 className="card__title" id="certificate-title">
          Sertifikat coaching
        </h2>
        <p className="muted small">
          Prototipe ini menyimpan metadata berkas saja; tidak ada unggahan biner.
        </p>
        {uploadError && <Banner variant="danger">{uploadError}</Banner>}
        {(certificate ||
          upgrade.checklist.find((item) => item.key === 'certificate')?.status === 'VERIFIED') && (
          <Banner variant="success" title="Sertifikat diterima">
            {certificate
              ? `${certificate.fileName} · status ${certificate.status}`
              : 'Sertifikat sudah diverifikasi admin.'}
          </Banner>
        )}
        <TextField
          id="fileName"
          label="Nama berkas"
          placeholder="sertifikat-coaching.pdf"
          value={fileName}
          onChange={(event) => setFileName(event.target.value)}
          help="Ekstensi pdf, jpg, atau png."
          disabled={uploading || isPremium}
        />
        <TextField
          id="issuer"
          label="Penerbit"
          value={issuer}
          onChange={(event) => setIssuer(event.target.value)}
          disabled={uploading || isPremium}
        />
        <div className="grid grid--2">
          <TextField
            id="issuedAt"
            label="Tanggal terbit"
            type="date"
            value={issuedAt}
            onChange={(event) => setIssuedAt(event.target.value)}
            disabled={uploading || isPremium}
          />
          <TextField
            id="expiresAt"
            label="Berlaku sampai"
            type="date"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
            disabled={uploading || isPremium}
          />
        </div>
        <div className="form-actions">
          <Button
            onClick={() => void uploadCertificate()}
            loading={uploading}
            loadingLabel="Mengirim…"
            disabled={!fileName.trim() || isPremium}
          >
            Kirim sertifikat
          </Button>
        </div>
      </section>

      {!isPremium && (
        <section className="card stack">
          <h2 className="card__title">Ajukan verifikasi Premium</h2>
          <p className="muted small">
            Admin akan memeriksa sertifikat. Badge terbit otomatis setelah semua syarat
            terverifikasi.
          </p>
          {submitError && (
            <Banner variant="danger" title="Belum dapat dikirim">
              {submitError}
            </Banner>
          )}
          {missing.length > 0 && (
            <Banner variant="warning" title="Syarat akademik belum terverifikasi">
              {missing.join(', ')}
            </Banner>
          )}
          <div className="form-actions">
            <Button
              onClick={() => void submitUpgrade()}
              loading={submitting}
              loadingLabel="Mengirim…"
            >
              Kirim permintaan upgrade
            </Button>
            <Link className="btn btn--ghost btn--md" to="/mentor/pengajuan/1">
              Lengkapi bukti akademik
            </Link>
          </div>
        </section>
      )}

      <Modal
        open={showAssessment}
        title="Asesmen pemahaman"
        onClose={() => setShowAssessment(false)}
        size="lg"
        dismissible={!submittingAssessment}
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setShowAssessment(false)}
              disabled={submittingAssessment}
            >
              {copy.cancel}
            </Button>
            <Button
              onClick={() => void submitAssessment()}
              loading={submittingAssessment}
              loadingLabel="Menilai…"
              disabled={Object.keys(answers).length < assessmentItems.length}
            >
              Kirim jawaban
            </Button>
          </>
        }
      >
        <div className="stack">
          {assessmentError && <Banner variant="danger">{assessmentError}</Banner>}
          {assessmentItems.map((item, index) => (
            <fieldset className="field" key={item.questionId}>
              <legend className="field__label">
                {index + 1}. {item.prompt}
              </legend>
              <div className="radio-cards">
                {item.choices.map((choice, choiceIndex) => (
                  <label
                    key={choice}
                    className={`radio-card${answers[item.questionId] === choiceIndex ? ' is-selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name={item.questionId}
                      checked={answers[item.questionId] === choiceIndex}
                      onChange={() =>
                        setAnswers((current) => ({ ...current, [item.questionId]: choiceIndex }))
                      }
                    />
                    <span className="radio-card__body">
                      <span>{choice}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
      </Modal>

      <ModuleModal
        moduleId={activeModule}
        onClose={() => setActiveModule(null)}
        onComplete={(id) => void completeModule(id)}
      />
    </div>
  );
}

function labelForStatus(status: string): string {
  if (status === 'VERIFIED') return 'Terverifikasi';
  if (status === 'IN_PROGRESS') return 'Sedang berjalan';
  if (status === 'REJECTED') return 'Perlu perbaikan';
  return 'Belum dimulai';
}

function ModuleModal({
  moduleId,
  onClose,
  onComplete,
}: {
  moduleId: string | null;
  onClose: () => void;
  onComplete: (id: string) => void;
}) {
  const { state } = useApi<TrainingModuleDetail>(moduleId ? `/training/modules/${moduleId}` : null);
  return (
    <Modal
      open={moduleId !== null}
      title={state.status === 'ready' ? state.data.title : 'Modul pelatihan'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {copy.close}
          </Button>
          {state.status === 'ready' && (
            <Button
              onClick={() => onComplete(state.data.id)}
              disabled={state.data.completed}
              variant={state.data.completed ? 'secondary' : 'primary'}
            >
              {state.data.completed ? 'Sudah selesai' : 'Tandai selesai'}
            </Button>
          )}
        </>
      }
    >
      {state.status === 'loading' && <SkeletonLines lines={6} />}
      {state.status === 'error' && <Banner variant="danger">{state.message}</Banner>}
      {state.status === 'ready' && (
        <div className="prose">
          {state.data.content.split('\n').map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          <p className="muted small">{state.data.durationMinutes} menit</p>
        </div>
      )}
    </Modal>
  );
}
