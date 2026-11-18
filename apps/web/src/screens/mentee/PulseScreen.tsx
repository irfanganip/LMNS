import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, errorMessage } from '../../api/client';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { Stepper } from '../../components/Indicators';
import { copy } from '../../copy/id';

const steps = [
  { label: 'Profil akademik' },
  { label: 'Pulse kesejahteraan' },
  { label: 'Pilih mentor' },
];

const scaleLabels = ['Sangat rendah', 'Rendah', 'Sedang', 'Tinggi', 'Sangat tinggi'];

function Likert({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
}: {
  id: string;
  label: string;
  value: number | null;
  onChange: (value: number) => void;
  disabled: boolean;
  error?: string;
}) {
  return (
    <fieldset className="likert">
      <legend className="field__label">{label}</legend>
      <div className="likert__options" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((point) => (
          <label key={point} className={`likert__option${value === point ? ' is-selected' : ''}`}>
            <input
              type="radio"
              name={id}
              value={point}
              checked={value === point}
              onChange={() => onChange(point)}
              disabled={disabled}
            />
            <span className="likert__number">{point}</span>
            <span className="likert__text">{scaleLabels[point - 1]}</span>
          </label>
        ))}
      </div>
      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}

export function PulseScreen() {
  const navigate = useNavigate();
  const [workloadStress, setWorkloadStress] = useState<number | null>(null);
  const [researchBlocker, setResearchBlocker] = useState<number | null>(null);
  const [preferredTone, setPreferredTone] = useState<'GENTLE' | 'STRUCTURED' | ''>('');
  const [submitting, setSubmitting] = useState<'save' | 'skip' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(skip: boolean) {
    setError(null);
    setSubmitting(skip ? 'skip' : 'save');
    try {
      await api('/me/pulses', {
        method: 'POST',
        body: skip
          ? { skipped: true }
          : {
              answers: {
                workloadStress,
                researchBlocker,
                preferredTone: preferredTone || null,
              },
            },
      });
      setSaved(true);
      window.setTimeout(() => navigate('/'), 900);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="stack stack--lg narrow">
      <header className="stack stack--sm">
        <Stepper steps={steps} current={1} />
        <h1 className="page-title">Pulse kesejahteraan</h1>
        <p className="muted">
          Tiga pertanyaan singkat sebelum Anda memilih mentor. Tidak ada jawaban benar atau salah.
        </p>
      </header>

      <Banner variant="info" title="Data pribadi">
        {copy.privacyPulse}
      </Banner>

      {saved && (
        <Banner variant="success" title={copy.saved}>
          {copy.pulseSaved}
        </Banner>
      )}

      {error && (
        <Banner variant="danger" title="Jawaban belum tersimpan">
          {error}
        </Banner>
      )}

      <div className="card stack">
        <Likert
          id="workloadStress"
          label="Seberapa besar beban akademik yang Anda rasakan minggu ini?"
          value={workloadStress}
          onChange={setWorkloadStress}
          disabled={submitting !== null}
        />
        <Likert
          id="researchBlocker"
          label="Seberapa menghambat kebuntuan riset yang sedang Anda hadapi?"
          value={researchBlocker}
          onChange={setResearchBlocker}
          disabled={submitting !== null}
        />

        <fieldset className="field">
          <legend className="field__label">Gaya pendampingan yang Anda inginkan</legend>
          <div className="chips">
            {[
              { value: 'GENTLE', label: 'Menenangkan & suportif' },
              { value: 'STRUCTURED', label: 'Terstruktur & terukur' },
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                className={`chip${preferredTone === option.value ? ' chip--selected' : ''}`}
                aria-pressed={preferredTone === option.value}
                onClick={() =>
                  setPreferredTone((current) =>
                    current === option.value ? '' : (option.value as 'GENTLE' | 'STRUCTURED'),
                  )
                }
                disabled={submitting !== null}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <p className="muted small">
          LMNS bukan layanan kesehatan mental. Bila Anda membutuhkan bantuan klinis, hubungi layanan
          konseling kampus atau profesional.
        </p>

        <div className="form-actions">
          <Button
            onClick={() => void submit(false)}
            loading={submitting === 'save'}
            loadingLabel="Menyimpan…"
            disabled={submitting !== null}
          >
            Simpan jawaban
          </Button>
          <Button
            variant="ghost"
            onClick={() => void submit(true)}
            loading={submitting === 'skip'}
            loadingLabel="Melewati…"
            disabled={submitting !== null}
          >
            {copy.skip}
          </Button>
        </div>
        <p className="muted small">{copy.pulseSkippedNote}</p>
      </div>
    </div>
  );
}
