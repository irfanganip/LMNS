import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, errorMessage, fieldErrors } from '../../api/client';
import type { Application, Tier } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { ApplicationPill, Stepper } from '../../components/Indicators';
import { SelectField, TextArea, TextField } from '../../components/Field';
import { SkeletonLines } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { copy } from '../../copy/id';
import { useApi } from '../../hooks/useApi';
import {
  StorefrontFields,
  StorefrontPreview,
  draftFromStorefront,
  type StorefrontDraft,
} from './StorefrontFields';

type EvidenceKey = string;

const evidenceFields: Record<
  Tier,
  {
    key: EvidenceKey;
    label: string;
    kind: 'url' | 'text';
    help: string;
    required: boolean;
    pattern?: RegExp;
    patternMessage?: string;
  }[]
> = {
  BASIC: [
    {
      key: 'degreeUrl',
      label: 'Ijazah (tautan)',
      kind: 'url',
      help: 'Tautan https:// ke berkas ijazah.',
      required: true,
    },
    {
      key: 'overseasExperienceUrl',
      label: 'Bukti pengalaman luar negeri (tautan)',
      kind: 'url',
      help: 'Surat tugas, LoA, atau halaman program.',
      required: true,
    },
    {
      key: 'organisationUrl',
      label: 'Halaman institusi (tautan)',
      kind: 'url',
      help: 'Halaman profil di situs kampus/organisasi.',
      required: true,
    },
    {
      key: 'googleScholarUrl',
      label: 'Google Scholar',
      kind: 'url',
      help: 'Tautan profil Google Scholar.',
      required: true,
    },
    {
      key: 'linkedinUrl',
      label: 'LinkedIn',
      kind: 'url',
      help: 'Tautan profil LinkedIn.',
      required: true,
    },
  ],
  EDUCATOR_STANDARD: [
    {
      key: 's3VerificationUrl',
      label: 'Verifikasi S3 (tautan)',
      kind: 'url',
      help: 'Bukti gelar doktor.',
      required: true,
    },
    {
      key: 'sisterId',
      label: 'SISTER ID',
      kind: 'text',
      help: '10 digit angka.',
      required: true,
      pattern: /^\d{10}$/,
      patternMessage: 'SISTER ID harus 10 digit angka.',
    },
    {
      key: 'institutionalEmailVerified',
      label: 'Email institusi terverifikasi',
      kind: 'text',
      help: 'Mengikuti verifikasi OTP email kampus Anda.',
      required: true,
    },
    {
      key: 'googleScholarUrl',
      label: 'Google Scholar',
      kind: 'url',
      help: 'Tautan profil Google Scholar.',
      required: true,
    },
    {
      key: 'linkedinUrl',
      label: 'LinkedIn',
      kind: 'url',
      help: 'Tautan profil LinkedIn.',
      required: true,
    },
  ],
  EDUCATOR_PREMIUM: [
    {
      key: 's3VerificationUrl',
      label: 'Verifikasi S3 (tautan)',
      kind: 'url',
      help: 'Bukti gelar doktor.',
      required: true,
    },
    {
      key: 'overseasExperienceUrl',
      label: 'Bukti pengalaman luar negeri (tautan)',
      kind: 'url',
      help: 'Surat tugas, LoA, atau halaman program.',
      required: true,
    },
    {
      key: 'scopusId',
      label: 'Scopus ID',
      kind: 'text',
      help: 'Isi Scopus ID atau ORCID.',
      required: false,
    },
    {
      key: 'orcidId',
      label: 'ORCID',
      kind: 'text',
      help: 'Format 0000-0000-0000-0000.',
      required: false,
      pattern: /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/,
      patternMessage: 'ORCID harus berformat 0000-0000-0000-000X.',
    },
    {
      key: 'googleScholarUrl',
      label: 'Google Scholar',
      kind: 'url',
      help: 'Tautan profil Google Scholar.',
      required: true,
    },
    {
      key: 'linkedinUrl',
      label: 'LinkedIn',
      kind: 'url',
      help: 'Tautan profil LinkedIn.',
      required: true,
    },
    {
      key: 'certificateUrl',
      label: 'Sertifikat coaching (tautan)',
      kind: 'url',
      help: 'Diunggah juga di langkah Premium.',
      required: true,
    },
  ],
};

const steps = [{ label: 'Identitas & bukti' }, { label: 'Asesmen diri' }, { label: 'Etalase' }];

export function MentorApplicationWizard() {
  const { step = '1' } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const { showToast } = useToast();
  const current = useApi<Application | null>('/mentor/applications/current');
  const [creating, setCreating] = useState<Tier | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  const stepIndex = Math.min(3, Math.max(1, Number(step))) - 1;

  if (current.state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={5} />
      </div>
    );
  }
  if (current.state.status === 'error') {
    return (
      <ErrorRetry
        message={`Gagal memuat pengajuan. ${current.state.message}`}
        onRetry={current.reload}
      />
    );
  }

  const application = current.state.data;

  if (!application) {
    return (
      <div className="stack stack--lg narrow">
        <h1 className="page-title">Pilih tier pengajuan</h1>
        <p className="muted">
          Tier menentukan bukti yang perlu Anda unggah. Anda dapat mengajukan tier yang lebih tinggi
          setelah disetujui.
        </p>
        {createError && <Banner variant="danger">{createError}</Banner>}
        <div className="radio-cards">
          {(['BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM'] as const).map((tier) => (
            <label key={tier} className={`radio-card${creating === tier ? ' is-selected' : ''}`}>
              <input
                type="radio"
                name="tier"
                value={tier}
                checked={creating === tier}
                onChange={() => setCreating(tier)}
              />
              <span className="radio-card__body">
                <span className="radio-card__title">
                  {tier === 'BASIC'
                    ? 'Basic Mentor'
                    : tier === 'EDUCATOR_STANDARD'
                      ? 'Educator Mentor'
                      : 'Premium Educator Mentor'}
                </span>
                <span className="muted small">
                  {tier === 'BASIC'
                    ? 'Pengalaman praktisi + jejak luar negeri. Sesi berbayar, honor disepakati di ruang mediasi.'
                    : tier === 'EDUCATOR_STANDARD'
                      ? 'Dosen dengan verifikasi S3 dan SISTER. Sesi tanpa honor (Rp 0).'
                      : 'Educator + sertifikasi Well-Being LMNS, pelatihan dan asesmen.'}
                </span>
              </span>
            </label>
          ))}
        </div>
        <Button
          disabled={!creating}
          onClick={async () => {
            if (!creating) return;
            setCreateError(null);
            try {
              await api<Application>('/mentor/applications', {
                method: 'POST',
                body: { tier: creating },
              });
              current.reload();
            } catch (error) {
              setCreateError(errorMessage(error));
            }
          }}
        >
          Buat pengajuan
        </Button>
      </div>
    );
  }

  if (application.status === 'PENDING_REVIEW' || application.status === 'APPROVED') {
    return (
      <div className="stack narrow">
        <div className="card__head">
          <h1 className="page-title">Pengajuan {application.tierLabel}</h1>
          <ApplicationPill status={application.status} />
        </div>
        <Banner
          variant={application.status === 'APPROVED' ? 'success' : 'info'}
          title={
            application.status === 'APPROVED' ? 'Pengajuan disetujui' : copy.reviewPendingTitle
          }
        >
          {application.status === 'APPROVED'
            ? 'Etalase Anda sudah terbit. Perubahan etalase dapat dilakukan kapan saja.'
            : copy.reviewPendingBody}
        </Banner>
        {application.status === 'APPROVED' && (
          <Button onClick={() => navigate('/mentor/studio')}>Buka etalase</Button>
        )}
      </div>
    );
  }

  return (
    <div className="stack stack--lg">
      <header className="stack stack--sm">
        <Stepper steps={steps} current={stepIndex} />
        <div className="page-head">
          <h1 className="page-title">Pengajuan {application.tierLabel}</h1>
          <ApplicationPill status={application.status} />
        </div>
        {application.status === 'REJECTED' && (
          <Banner variant="warning" title={copy.rejectBannerTitle}>
            {application.decisionNote ?? copy.rejectBannerBody}
          </Banner>
        )}
        {application.missingItems.length > 0 && (
          <Banner variant="warning" title="Butir yang belum lengkap">
            {application.missingItems.map((item) => item.label).join(', ')}
          </Banner>
        )}
      </header>

      {stepIndex === 0 && (
        <IdentityStep
          application={application}
          onSaved={() => navigate('/mentor/pengajuan/2')}
          emailVerified={
            session.phase === 'authenticated' && session.me.user.emailVerifiedAt !== null
          }
        />
      )}
      {stepIndex === 1 && (
        <SelfAssessmentStep
          application={application}
          onSaved={() => navigate('/mentor/pengajuan/3')}
        />
      )}
      {stepIndex === 2 && (
        <StorefrontStep
          application={application}
          onSaved={async () => {
            current.reload();
            showToast(copy.saved);
          }}
          onSubmitted={() => {
            showToast('Pengajuan dikirim untuk verifikasi.');
            current.reload();
          }}
        />
      )}
    </div>
  );
}

function IdentityStep({
  application,
  onSaved,
  emailVerified,
}: {
  application: Application;
  onSaved: () => void;
  emailVerified: boolean;
}) {
  const evidence = application.evidence ?? {};
  const [displayName, setDisplayName] = useState(String(evidence.displayName ?? ''));
  const [academicTitle, setAcademicTitle] = useState(String(evidence.academicTitle ?? ''));
  const [institution, setInstitution] = useState(String(evidence.institution ?? ''));
  const [discipline, setDiscipline] = useState(String(evidence.discipline ?? ''));
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      evidenceFields[application.tier]
        .filter((field) => field.kind === 'url' || field.pattern)
        .map((field) => [
          field.key,
          typeof evidence[field.key] === 'string' ? String(evidence[field.key]) : '',
        ]),
    ),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = evidenceFields[application.tier];
  const needsScopusOrOrcid = application.tier === 'EDUCATOR_PREMIUM';

  async function save() {
    setError(null);
    const nextErrors: Record<string, string> = {};
    for (const field of fields) {
      if (!field.required) continue;
      const value = values[field.key]?.trim();
      if (!value) nextErrors[field.key] = 'Wajib diisi.';
      else if (field.kind === 'url' && !/^https?:\/\//.test(value))
        nextErrors[field.key] = 'Gunakan tautan http(s)://';
      else if (field.pattern && !field.pattern.test(value))
        nextErrors[field.key] = field.patternMessage ?? 'Format tidak sesuai.';
    }
    if (needsScopusOrOrcid && !values.scopusId?.trim() && !values.orcidId?.trim()) {
      nextErrors.scopusId = 'Isi Scopus ID atau ORCID.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    try {
      await api<Application>(`/mentor/applications/${application.id}/identity`, {
        method: 'PATCH',
        body: {
          displayName: displayName.trim() || undefined,
          academicTitle: academicTitle.trim() || undefined,
          institution: institution.trim() || undefined,
          discipline: discipline.trim() || undefined,
          evidence: {
            ...values,
            ...(application.tier === 'EDUCATOR_STANDARD'
              ? { institutionalEmailVerified: emailVerified }
              : {}),
          },
        },
      });
      onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
      setErrors(fieldErrors(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card stack">
      <h2 className="card__title">Identitas & bukti</h2>
      {error && (
        <Banner variant="danger" title="Belum tersimpan">
          {error}
        </Banner>
      )}

      <TextField
        id="displayName"
        label="Nama tampilan"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        disabled={saving}
      />
      <TextField
        id="academicTitle"
        label="Jabatan akademik"
        value={academicTitle}
        onChange={(e) => setAcademicTitle(e.target.value)}
        disabled={saving}
      />
      <TextField
        id="institution"
        label="Institusi"
        value={institution}
        onChange={(e) => setInstitution(e.target.value)}
        disabled={saving}
      />
      <SelectField
        id="discipline"
        label="Bidang"
        value={discipline}
        onChange={(e) => setDiscipline(e.target.value)}
        disabled={saving}
      >
        <option value="">Pilih bidang</option>
        {[
          'Computer Science',
          'Engineering',
          'Social Sciences',
          'Humanities',
          'Life Sciences',
          'Economics',
          'Education',
        ].map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </SelectField>

      <div className="divider" />

      {application.tier === 'EDUCATOR_STANDARD' && (
        <Banner variant={emailVerified ? 'success' : 'warning'} title="Email institusi">
          {emailVerified
            ? 'Email kampus Anda sudah terverifikasi melalui OTP.'
            : 'Verifikasi email kampus Anda terlebih dahulu agar bukti ini sah.'}{' '}
          {!emailVerified && <Link to="/verifikasi">Verifikasi sekarang</Link>}
        </Banner>
      )}

      {fields
        .filter((field) => field.kind === 'url' || field.pattern)
        .map((field) => (
          <TextField
            key={field.key}
            id={field.key}
            label={field.label}
            required={
              field.required ||
              (needsScopusOrOrcid && (field.key === 'scopusId' || field.key === 'orcidId'))
            }
            help={field.help}
            placeholder={field.kind === 'url' ? 'https://…' : undefined}
            value={values[field.key] ?? ''}
            onChange={(event) =>
              setValues((current) => ({ ...current, [field.key]: event.target.value }))
            }
            error={errors[field.key]}
            disabled={saving}
          />
        ))}

      <div className="form-actions">
        <Button onClick={() => void save()} loading={saving} loadingLabel="Menyimpan…">
          {copy.save} & {copy.next}
        </Button>
        <Link className="btn btn--ghost btn--md" to="/mentor/dashboard">
          {copy.cancel}
        </Link>
      </div>
    </div>
  );
}

function SelfAssessmentStep({
  application,
  onSaved,
}: {
  application: Application;
  onSaved: () => void;
}) {
  const existing = application.selfAssessment;
  const [philosophy, setPhilosophy] = useState(existing?.philosophy ?? '');
  const [boundaries, setBoundaries] = useState(existing?.boundaries ?? '');
  const [burnoutApproach, setBurnoutApproach] = useState(existing?.burnoutApproach ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = [
    {
      key: 'philosophy',
      label: 'Filosofi pendampingan Anda',
      help: 'Bagaimana Anda mendampingi mentee secara akademik dan emosional?',
      value: philosophy,
      set: setPhilosophy,
    },
    {
      key: 'boundaries',
      label: 'Batas peran Anda',
      help: 'Apa yang Anda lakukan dan tidak lakukan ketika mentee menunjukkan tanda stres berat?',
      value: boundaries,
      set: setBoundaries,
    },
    {
      key: 'burnoutApproach',
      label: 'Pendekatan saat burnout',
      help: 'Langkah konkret Anda ketika mentee kelelahan akademik.',
      value: burnoutApproach,
      set: setBurnoutApproach,
    },
  ];

  async function save() {
    setError(null);
    const next: Record<string, string> = {};
    for (const field of fields) {
      if (field.value.trim().length < 40) next[field.key] = 'Minimal 40 karakter.';
      else if (field.value.length > 1200) next[field.key] = 'Maksimal 1200 karakter.';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSaving(true);
    try {
      await api(`/mentor/applications/${application.id}/self-assessment`, {
        method: 'PUT',
        body: { philosophy, boundaries, burnoutApproach },
      });
      onSaved();
    } catch (caught) {
      setError(errorMessage(caught));
      setErrors(fieldErrors(caught));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card stack">
      <h2 className="card__title">Asesmen diri</h2>
      <p className="muted small">Jawaban ini tidak dipublikasikan; hanya dibaca verifikator.</p>
      {error && (
        <Banner variant="danger" title="Belum tersimpan">
          {error}
        </Banner>
      )}
      {fields.map((field) => (
        <TextArea
          key={field.key}
          id={field.key}
          label={field.label}
          help={field.help}
          rows={5}
          maxLength={1200}
          value={field.value}
          onChange={(event) => field.set(event.target.value)}
          error={errors[field.key]}
          counter={`${field.value.length}/1200`}
          disabled={saving}
        />
      ))}
      <div className="form-actions">
        <Button onClick={() => void save()} loading={saving} loadingLabel="Menyimpan…">
          {copy.save} & {copy.next}
        </Button>
        <Link className="btn btn--ghost btn--md" to="/mentor/pengajuan/1">
          {copy.back}
        </Link>
      </div>
    </div>
  );
}

function StorefrontStep({
  application,
  onSaved,
  onSubmitted,
}: {
  application: Application;
  onSaved: () => void;
  onSubmitted: () => void;
}) {
  const [draft, setDraft] = useState<StorefrontDraft>(() =>
    draftFromStorefront(application.storefront),
  );
  const [saving, setSaving] = useState<'save' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  async function save(next: 'save' | 'submit') {
    setError(null);
    setMissing([]);
    setSaving(next);
    try {
      await api(`/mentor/applications/${application.id}/storefront`, {
        method: 'PUT',
        body: {
          ...draft,
          packages: draft.packages.map((pkg) => ({
            ...pkg,
            id: pkg.id.startsWith('tmp_') ? undefined : pkg.id,
          })),
        },
      });
      onSaved();
      if (next === 'submit') {
        try {
          await api(`/mentor/applications/${application.id}/submit`, { method: 'POST' });
          onSubmitted();
        } catch (caught) {
          if (caught instanceof ApiError && caught.code === 'EVIDENCE_MISSING') {
            const details = caught.details as { missingItems?: { label: string }[] } | undefined;
            setMissing(details?.missingItems?.map((item) => item.label) ?? []);
          }
          setError(errorMessage(caught));
        }
      }
    } catch (caught) {
      setError(errorMessage(caught));
      setErrors(fieldErrors(caught));
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="stack">
      <div className="card stack">
        <h2 className="card__title">Etalase</h2>
        {error && (
          <Banner variant="danger" title="Etalase belum tersimpan">
            {error}
          </Banner>
        )}
        {missing.length > 0 && (
          <Banner variant="warning" title="Pengajuan belum bisa dikirim">
            {missing.join(', ')}
          </Banner>
        )}

        <StorefrontFields
          value={draft}
          onChange={setDraft}
          errors={errors}
          disabled={saving !== null}
        />

        <div className="form-actions">
          <Button
            onClick={() => void save('save')}
            variant="secondary"
            loading={saving === 'save'}
            loadingLabel="Menyimpan…"
          >
            {copy.saveDraft}
          </Button>
          <Button
            onClick={() => void save('submit')}
            loading={saving === 'submit'}
            loadingLabel="Mengirim…"
          >
            Kirim pengajuan
          </Button>
          <Button variant="ghost" type="button" onClick={() => setShowPreview((value) => !value)}>
            {showPreview ? 'Sembunyikan pratinjau' : 'Pratinjau etalase'}
          </Button>
        </div>
      </div>

      {showPreview && <StorefrontPreview value={draft} />}
    </div>
  );
}
