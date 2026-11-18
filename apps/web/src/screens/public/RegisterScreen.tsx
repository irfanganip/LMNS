import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, errorMessage, fieldErrors } from '../../api/client';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { FilterChip } from '../../components/Indicators';
import { SelectField, TextField } from '../../components/Field';
import { copy } from '../../copy/id';

type RegisterResponse = {
  userId: string;
  email: string;
  emailVerified: boolean;
  otp: { required: boolean; expiresAt: string; demoOtp: string | null };
};

export function RegisterScreen() {
  const { config, refreshMe } = useSession();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [academicLevel, setAcademicLevel] = useState('');
  const [university, setUniversity] = useState('');
  const [facultyMajor, setFacultyMajor] = useState('');
  const [semester, setSemester] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [domainHint, setDomainHint] = useState<string | null>(null);

  function onEmailBlur() {
    if (!config || !email.includes('@')) {
      setDomainHint(null);
      return;
    }
    const domain = email.split('@')[1]?.toLowerCase() ?? '';
    const allowed = config.allowedEmailDomains.some(
      (item) => domain === item.toLowerCase() || domain.endsWith(`.${item.toLowerCase()}`),
    );
    setDomainHint(allowed ? null : copy.authDomainBlocked);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setErrors({});
    if (goals.length === 0) {
      setErrors({ goals: copy.goalRequired });
      return;
    }
    setSubmitting(true);
    try {
      const result = await api<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: {
          email: email.trim(),
          academicLevel: academicLevel || undefined,
          university: university.trim() || undefined,
          facultyMajor: facultyMajor.trim() || undefined,
          semester: semester ? Number(semester) : undefined,
          goals,
        },
      });
      await refreshMe();
      navigate('/verifikasi', {
        state: {
          email: result.email,
          demoOtp: result.otp.demoOtp ?? undefined,
          expiresAt: result.otp.expiresAt,
        },
      });
    } catch (caught) {
      setError(errorMessage(caught));
      setErrors(fieldErrors(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-card__title">Daftar akun mentee</h1>
        <p className="muted">
          Gunakan email kampus Anda. Kami mengirim kode 6 digit untuk memastikan email aktif.
        </p>
        <p className="muted small">
          Prototipe ini tidak memakai kata sandi: masuk dilakukan lewat email kampus dan kode
          verifikasi.
        </p>

        {error && (
          <Banner variant="danger" title="Pendaftaran gagal">
            {error}
          </Banner>
        )}

        <form className="stack" onSubmit={(event) => void onSubmit(event)} noValidate>
          <TextField
            id="email"
            label="Email kampus"
            type="email"
            required
            autoComplete="email"
            placeholder="nama@kampus.ac.id"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onBlur={onEmailBlur}
            error={errors.email}
            help={
              domainHint ??
              (config
                ? `Domain yang diterima: ${config.allowedEmailDomains.join(', ')}`
                : undefined)
            }
            disabled={submitting}
          />

          <SelectField
            id="academicLevel"
            label="Jenjang"
            value={academicLevel}
            onChange={(event) => setAcademicLevel(event.target.value)}
            error={errors.academicLevel}
            disabled={submitting}
          >
            <option value="">Pilih jenjang</option>
            <option value="S1">S1</option>
            <option value="S2">S2</option>
            <option value="S3">S3</option>
          </SelectField>

          <TextField
            id="university"
            label="Kampus"
            value={university}
            onChange={(event) => setUniversity(event.target.value)}
            error={errors.university}
            autoComplete="organization"
            disabled={submitting}
          />

          <TextField
            id="facultyMajor"
            label="Fakultas / program studi"
            value={facultyMajor}
            onChange={(event) => setFacultyMajor(event.target.value)}
            error={errors.facultyMajor}
            disabled={submitting}
          />

          <TextField
            id="semester"
            label="Semester"
            type="number"
            min={1}
            max={14}
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            error={errors.semester}
            disabled={submitting}
          />

          <fieldset className="field">
            <legend className="field__label">
              Tujuan bimbingan{' '}
              <span className="field__required" aria-hidden="true">
                *
              </span>
            </legend>
            <p className="field__help">Pilih satu atau lebih.</p>
            <div className="chips">
              {copy.goals.map((goal) => (
                <FilterChip
                  key={goal.value}
                  label={goal.label}
                  selected={goals.includes(goal.value)}
                  disabled={submitting}
                  onClick={() =>
                    setGoals((current) =>
                      current.includes(goal.value)
                        ? current.filter((item) => item !== goal.value)
                        : [...current, goal.value],
                    )
                  }
                />
              ))}
            </div>
            {errors.goals && (
              <p className="field__error" role="alert">
                {errors.goals}
              </p>
            )}
          </fieldset>

          <Button type="submit" loading={submitting} loadingLabel="Mengirim kode…" fullWidth>
            Daftar & kirim kode
          </Button>
        </form>

        <p className="auth-card__foot">
          Sudah punya akun? <Link to="/masuk">Masuk</Link>
        </p>
      </div>
    </div>
  );
}
