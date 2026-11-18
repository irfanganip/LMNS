import { useState } from 'react';
import type { Package, Storefront } from '../../api/types';
import { Button } from '../../components/Button';
import { FilterChip } from '../../components/Indicators';
import { TextArea, TextField } from '../../components/Field';
import { IconPlus, IconTrash } from '../../components/Icons';
import { formatRupiah } from '../../copy/id';

export type StorefrontDraft = Omit<Storefront, 'published'>;

export function emptyPackage(): Package {
  return {
    id: `tmp_${Math.random().toString(36).slice(2)}`,
    title: '',
    description: '',
    durationMinutes: 60,
    priceIdr: 0,
    isFreeConsultation: true,
  };
}

export function draftFromStorefront(storefront: Storefront | null): StorefrontDraft {
  return {
    niche: storefront?.niche ?? '',
    strengths: storefront?.strengths ?? [],
    languages: storefront?.languages ?? ['id'],
    formats: storefront?.formats ?? ['online'],
    intro: storefront?.intro ?? '',
    introVideoUrl: storefront?.introVideoUrl ?? null,
    wellBeingPhilosophy: storefront?.wellBeingPhilosophy ?? '',
    packages: storefront?.packages?.length ? storefront.packages : [emptyPackage()],
  };
}

/** Shared storefront editor: the application wizard's step 3 and the studio screen. */
export function StorefrontFields({
  value,
  onChange,
  errors,
  disabled,
}: {
  value: StorefrontDraft;
  onChange: (next: StorefrontDraft) => void;
  errors: Record<string, string>;
  disabled: boolean;
}) {
  const [strengthDraft, setStrengthDraft] = useState('');
  const set = (patch: Partial<StorefrontDraft>) => onChange({ ...value, ...patch });
  const setPackage = (id: string, patch: Partial<Package>) =>
    set({ packages: value.packages.map((pkg) => (pkg.id === id ? { ...pkg, ...patch } : pkg)) });

  function toggle(list: string[], item: string): string[] {
    return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
  }

  return (
    <>
      <TextField
        id="niche"
        label="Niche"
        maxLength={80}
        required
        value={value.niche}
        onChange={(event) => set({ niche: event.target.value })}
        help="Contoh: metodologi penelitian kualitatif."
        error={errors.niche}
        disabled={disabled}
      />

      <fieldset className="field">
        <legend className="field__label">Kekuatan</legend>
        <p className="field__help">Maksimal 6 butir, masing-masing 60 karakter.</p>
        {value.strengths.length > 0 && (
          <ul className="tag-list">
            {value.strengths.map((item) => (
              <li key={item} className="tag tag--soft">
                {item}
                <button
                  type="button"
                  className="tag__remove"
                  aria-label={`Hapus ${item}`}
                  disabled={disabled}
                  onClick={() =>
                    set({ strengths: value.strengths.filter((entry) => entry !== item) })
                  }
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="inline-add">
          <label className="visually-hidden" htmlFor="strength-draft">
            Kekuatan baru
          </label>
          <input
            id="strength-draft"
            className="input"
            value={strengthDraft}
            maxLength={60}
            placeholder="Tambah kekuatan"
            onChange={(event) => setStrengthDraft(event.target.value)}
            disabled={disabled || value.strengths.length >= 6}
          />
          <Button
            size="sm"
            variant="secondary"
            icon={<IconPlus size={16} />}
            disabled={!strengthDraft.trim() || value.strengths.length >= 6 || disabled}
            onClick={() => {
              set({ strengths: [...value.strengths, strengthDraft.trim()] });
              setStrengthDraft('');
            }}
          >
            Tambah
          </Button>
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__label">Bahasa</legend>
        <div className="chips">
          <FilterChip
            label="Bahasa Indonesia"
            selected={value.languages.includes('id')}
            disabled={disabled}
            onClick={() => set({ languages: toggle(value.languages, 'id') })}
          />
          <FilterChip
            label="Inggris"
            selected={value.languages.includes('en')}
            disabled={disabled}
            onClick={() => set({ languages: toggle(value.languages, 'en') })}
          />
        </div>
      </fieldset>

      <fieldset className="field">
        <legend className="field__label">Format sesi</legend>
        <div className="chips">
          <FilterChip
            label="Online"
            selected={value.formats.includes('online')}
            disabled={disabled}
            onClick={() => set({ formats: toggle(value.formats, 'online') })}
          />
          <FilterChip
            label="Tatap muka"
            selected={value.formats.includes('in-person')}
            disabled={disabled}
            onClick={() => set({ formats: toggle(value.formats, 'in-person') })}
          />
        </div>
      </fieldset>

      <TextArea
        id="intro"
        label="Pengantar"
        rows={4}
        maxLength={800}
        value={value.intro}
        onChange={(event) => set({ intro: event.target.value })}
        error={errors.intro}
        counter={`${value.intro.length}/800`}
        disabled={disabled}
      />

      <TextField
        id="introVideoUrl"
        label="Tautan video perkenalan (opsional)"
        placeholder="https://…"
        value={value.introVideoUrl ?? ''}
        onChange={(event) => set({ introVideoUrl: event.target.value || null })}
        error={errors.introVideoUrl}
        disabled={disabled}
      />

      <TextArea
        id="wellBeingPhilosophy"
        label="Pendekatan kesejahteraan"
        rows={4}
        value={value.wellBeingPhilosophy}
        onChange={(event) => set({ wellBeingPhilosophy: event.target.value })}
        error={errors.wellBeingPhilosophy}
        help="Bagaimana Anda menjaga keamanan psikologis mentee."
        disabled={disabled}
      />

      <div className="divider" />

      <div className="card__head">
        <h3 className="card__title">Paket sesi</h3>
        <Button
          size="sm"
          variant="secondary"
          icon={<IconPlus size={16} />}
          disabled={value.packages.length >= 5 || disabled}
          onClick={() => set({ packages: [...value.packages, emptyPackage()] })}
        >
          Tambah paket
        </Button>
      </div>

      {value.packages.map((pkg, index) => (
        <div className="package-edit" key={pkg.id}>
          <div className="package-edit__head">
            <p className="package-edit__title">Paket {index + 1}</p>
            <button
              type="button"
              className="icon-btn"
              aria-label="Hapus paket"
              disabled={value.packages.length === 1 || disabled}
              onClick={() => set({ packages: value.packages.filter((item) => item.id !== pkg.id) })}
            >
              <IconTrash size={16} />
            </button>
          </div>
          <TextField
            id={`pkg-title-${index}`}
            label="Judul"
            required
            value={pkg.title}
            onChange={(event) => setPackage(pkg.id, { title: event.target.value })}
            error={errors[`packages.${index}.title`]}
            disabled={disabled}
          />
          <TextField
            id={`pkg-desc-${index}`}
            label="Deskripsi"
            value={pkg.description}
            onChange={(event) => setPackage(pkg.id, { description: event.target.value })}
            disabled={disabled}
          />
          <div className="grid grid--2">
            <TextField
              id={`pkg-duration-${index}`}
              label="Durasi (menit)"
              type="number"
              min={30}
              max={180}
              value={String(pkg.durationMinutes)}
              onChange={(event) =>
                setPackage(pkg.id, { durationMinutes: Number(event.target.value) })
              }
              error={errors[`packages.${index}.durationMinutes`]}
              disabled={disabled}
            />
            <TextField
              id={`pkg-price-${index}`}
              label="Harga (IDR)"
              type="number"
              min={0}
              max={5000000}
              step={1000}
              value={String(pkg.priceIdr)}
              onChange={(event) => setPackage(pkg.id, { priceIdr: Number(event.target.value) })}
              help={pkg.priceIdr === 0 ? 'Konsultasi gratis (Rp 0)' : formatRupiah(pkg.priceIdr)}
              error={errors[`packages.${index}.priceIdr`]}
              disabled={disabled || pkg.isFreeConsultation}
            />
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={pkg.isFreeConsultation}
              onChange={(event) =>
                setPackage(pkg.id, {
                  isFreeConsultation: event.target.checked,
                  priceIdr: event.target.checked ? 0 : pkg.priceIdr,
                })
              }
              disabled={disabled}
            />
            <span>Konsultasi gratis</span>
          </label>
        </div>
      ))}
    </>
  );
}

export function StorefrontPreview({ value }: { value: StorefrontDraft }) {
  return (
    <section className="card stack storefront-preview" aria-label="Pratinjau etalase">
      <p className="eyebrow">Pratinjau</p>
      <h2 className="card__title">{value.niche || 'Niche belum diisi'}</h2>
      <p className="muted">{value.intro || 'Pengantar belum diisi.'}</p>
      {value.strengths.length > 0 && (
        <ul className="tag-list">
          {value.strengths.map((item) => (
            <li key={item} className="tag tag--soft">
              {item}
            </li>
          ))}
        </ul>
      )}
      <ul className="package-list">
        {value.packages
          .filter((pkg) => pkg.title)
          .map((pkg) => (
            <li key={pkg.id} className="package-row">
              <div>
                <p className="package-row__title">{pkg.title}</p>
                <p className="muted small">
                  {pkg.description} · {pkg.durationMinutes} menit
                </p>
              </div>
              <p className="package-row__price">
                {pkg.isFreeConsultation ? 'Gratis' : formatRupiah(pkg.priceIdr)}
              </p>
            </li>
          ))}
      </ul>
    </section>
  );
}
