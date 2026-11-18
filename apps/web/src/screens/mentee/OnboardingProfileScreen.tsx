import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage, fieldErrors } from '../../api/client';
import type { MenteeProfile } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { FilterChip, Stepper } from '../../components/Indicators';
import { SelectField, TextField } from '../../components/Field';
import { copy } from '../../copy/id';

const steps = [
  { label: 'Profil akademik' },
  { label: 'Pulse kesejahteraan' },
  { label: 'Pilih mentor' },
];

export function OnboardingProfileScreen() {
  const { session, refreshMe } = useSession();
  const navigate = useNavigate();
  const profile = session.phase === 'authenticated' ? session.me.menteeProfile : null;

  const [academicLevel, setAcademicLevel] = useState(profile?.academicLevel ?? '');
  const [university, setUniversity] = useState(profile?.university ?? '');
  const [facultyMajor, setFacultyMajor] = useState(profile?.facultyMajor ?? '');
  const [semester, setSemester] = useState(profile?.semester ? String(profile.semester) : '');
  const [goals, setGoals] = useState<string[]>(profile?.goals ?? []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const missingLevel = !academicLevel;
  const missingGoals = goals.length === 0;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const next: Record<string, string> = {};
    if (missingLevel) next.academicLevel = 'Pilih jenjang Anda.';
    if (missingGoals) next.goals = copy.goalRequired;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    try {
      await api<MenteeProfile>('/me/mentee', {
        method: 'PATCH',
        body: {
          academicLevel,
          university: university.trim() || null,
          facultyMajor: facultyMajor.trim() || null,
          semester: semester ? Number(semester) : null,
          goals,
        },
      });
      await refreshMe();
      navigate('/onboarding/pulse');
    } catch (caught) {
      setError(errorMessage(caught));
      setErrors(fieldErrors(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="stack stack--lg narrow">
      <header className="stack stack--sm">
        <Stepper steps={steps} current={0} />
        <h1 className="page-title">Profil akademik</h1>
        <p className="muted">
          Data ini dipakai untuk menampilkan mentor yang relevan. Anda dapat mengubahnya kapan saja.
        </p>
      </header>

      {error && (
        <Banner variant="danger" title="Profil belum tersimpan">
          {error} Perubahan Anda tetap ada di formulir ini.
        </Banner>
      )}

      <form className="card stack" onSubmit={(event) => void onSubmit(event)} noValidate>
        <SelectField
          id="academicLevel"
          label="Jenjang"
          required
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
          help="1–14"
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
          {(errors.goals || missingGoals) && (
            <p className="field__error" role="alert">
              {errors.goals ?? copy.goalRequired}
            </p>
          )}
        </fieldset>

        <div className="form-actions">
          <Button type="submit" loading={submitting} loadingLabel="Menyimpan…">
            Simpan & lanjut
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')} type="button">
            {copy.skip}
          </Button>
        </div>
      </form>
    </div>
  );
}
