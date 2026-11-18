import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, api, errorMessage, fieldErrors } from '../../api/client';
import type { Storefront } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
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

export function MentorStudioScreen() {
  const { state, reload } = useApi<Storefront>('/mentor/storefront');
  const { session } = useSession();
  const { showToast } = useToast();
  const [draft, setDraft] = useState<StorefrontDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(true);

  if (state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={6} />
      </div>
    );
  }

  if (state.status === 'error') {
    const notApproved = state.error instanceof ApiError && state.error.status === 403;
    if (notApproved) {
      return (
        <div className="stack narrow">
          <Banner variant="warning" title={copy.emptyStoreUnpublished}>
            Etalase dapat disunting setelah pengajuan mentor disetujui.
          </Banner>
          <Link className="btn btn--secondary btn--md" to="/mentor/pengajuan/1">
            Buka pengajuan
          </Link>
        </div>
      );
    }
    return <ErrorRetry message={`Gagal memuat etalase. ${state.message}`} onRetry={reload} />;
  }

  const storefront = state.data;
  const value = draft ?? draftFromStorefront(storefront);
  const publishedHref =
    session.phase === 'authenticated' && session.me.mentorProfile
      ? `/mentor/${session.me.mentorProfile.slug}`
      : null;

  async function save() {
    setSaving(true);
    setError(null);
    setErrors({});
    try {
      const updated = await api<Storefront>('/mentor/storefront', {
        method: 'PUT',
        body: {
          ...value,
          packages: value.packages.map((pkg) => ({
            ...pkg,
            id: pkg.id.startsWith('tmp_') ? undefined : pkg.id,
          })),
        },
      });
      setDraft(draftFromStorefront(updated));
      showToast('Etalase tersimpan dan langsung terbit.');
      reload();
    } catch (caught) {
      setError(errorMessage(caught));
      setErrors(fieldErrors(caught));
    } finally {
      setSaving(false);
    }
  }

  const dirty = draft !== null;

  return (
    <div className="stack stack--lg">
      <header className="page-head">
        <div>
          <h1 className="page-title">Etalase</h1>
          <p className="muted">
            Perubahan langsung tampil di marketplace setelah disimpan.
            {storefront.published ? ' Etalase Anda sedang terbit.' : ' Etalase Anda belum terbit.'}
          </p>
        </div>
        {publishedHref && (
          <Link className="btn btn--secondary btn--md" to={publishedHref}>
            Lihat halaman publik
          </Link>
        )}
      </header>

      {error && (
        <Banner variant="danger" title="Perubahan belum tersimpan">
          {error} Nilai yang Anda isi tetap ada di formulir.
        </Banner>
      )}
      {dirty && !error && (
        <Banner variant="info" title={copy.unsaved}>
          Tekan Simpan untuk menerbitkan perubahan.
        </Banner>
      )}

      <div className="studio">
        <div className="card stack">
          <StorefrontFields value={value} onChange={setDraft} errors={errors} disabled={saving} />
          <div className="form-actions">
            <Button onClick={() => void save()} loading={saving} loadingLabel="Menyimpan…">
              {copy.save}
            </Button>
            <Button variant="ghost" onClick={() => setDraft(null)} disabled={saving || !dirty}>
              Batalkan perubahan
            </Button>
            <Button
              variant="ghost"
              type="button"
              onClick={() => setShowPreview((current) => !current)}
            >
              {showPreview ? 'Sembunyikan pratinjau' : 'Pratinjau etalase'}
            </Button>
          </div>
        </div>

        {showPreview && (
          <aside className="studio__preview">
            <StorefrontPreview value={value} />
          </aside>
        )}
      </div>
    </div>
  );
}
