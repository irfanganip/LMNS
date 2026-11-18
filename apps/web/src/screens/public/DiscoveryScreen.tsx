import { useEffect, useMemo, useState } from 'react';
import { api, errorMessage } from '../../api/client';
import type { Facets, MentorList } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Button } from '../../components/Button';
import { EmptyState, ErrorRetry } from '../../components/EmptyState';
import { FilterChip } from '../../components/Indicators';
import { IconSearch } from '../../components/Icons';
import { MentorCardView } from '../../components/MentorCardView';
import { MentorCardSkeleton } from '../../components/Skeleton';
import { copy, formatRupiah } from '../../copy/id';
import { useApi } from '../../hooks/useApi';
import { buildQuery } from '../../utils/query';

type FilterState = {
  q: string;
  discipline: string[];
  degreeFocus: string[];
  tier: string[];
  destination: string[];
  maxFeeIdr: string;
  sort: string;
};

const emptyFilters: FilterState = {
  q: '',
  discipline: [],
  degreeFocus: [],
  tier: [],
  destination: [],
  maxFeeIdr: '',
  sort: 'relevance',
};

const destinations: Record<string, string> = {
  NL: 'Belanda',
  AU: 'Australia',
  JP: 'Jepang',
  UK: 'Inggris',
  US: 'Amerika Serikat',
  SG: 'Singapura',
};

const pageSize = 6;

export function DiscoveryScreen() {
  const { config } = useSession();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [searchDraft, setSearchDraft] = useState('');
  const [extraPages, setExtraPages] = useState<MentorList[]>([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setFilters((current) =>
        current.q === searchDraft ? current : { ...current, q: searchDraft },
      );
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchDraft]);

  const query = useMemo(() => buildQuery({ ...filters, page: 1, pageSize }), [filters]);
  const list = useApi<MentorList>(`/mentors${query}`);
  const facets = useApi<Facets>('/mentors/facets');

  useEffect(() => {
    setExtraPages([]);
    setLoadMoreError(null);
  }, [query]);

  const activeChips: { label: string; clear: () => void }[] = [];
  if (filters.q) {
    activeChips.push({ label: `“${filters.q}”`, clear: () => setSearchDraft('') });
  }
  for (const value of filters.discipline) {
    activeChips.push({ label: value, clear: () => toggle('discipline', value) });
  }
  for (const value of filters.degreeFocus) {
    activeChips.push({ label: value, clear: () => toggle('degreeFocus', value) });
  }
  for (const value of filters.tier) {
    activeChips.push({
      label: config?.tierLabels[value] ?? value,
      clear: () => toggle('tier', value),
    });
  }
  for (const value of filters.destination) {
    activeChips.push({
      label: destinations[value] ?? value,
      clear: () => toggle('destination', value),
    });
  }
  if (filters.maxFeeIdr) {
    const amount = Number(filters.maxFeeIdr);
    activeChips.push({
      label: amount === 0 ? 'Konsultasi gratis' : `≤ ${formatRupiah(amount)}`,
      clear: () => setFilters((current) => ({ ...current, maxFeeIdr: '' })),
    });
  }

  function update(patch: Partial<FilterState>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function toggle(key: 'discipline' | 'degreeFocus' | 'tier' | 'destination', value: string) {
    setFilters((current) => {
      const values = current[key];
      return {
        ...current,
        [key]: values.includes(value)
          ? values.filter((item) => item !== value)
          : [...values, value],
      };
    });
  }

  function clearAll() {
    setFilters(emptyFilters);
    setSearchDraft('');
  }

  const firstPageItems = list.state.status === 'ready' ? list.state.data.items : [];
  const items = [firstPageItems, ...extraPages.map((page) => page.items)].flat();
  const total = list.state.status === 'ready' ? list.state.data.total : 0;
  const currentPage = 1 + extraPages.length;

  async function loadMore() {
    setLoadingMore(true);
    setLoadMoreError(null);
    try {
      const next = await api<MentorList>(
        `/mentors${buildQuery({ ...filters, page: currentPage + 1, pageSize })}`,
      );
      setExtraPages((pages) => [...pages, next]);
    } catch (error) {
      setLoadMoreError(errorMessage(error));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="stack stack--lg">
      <section className="hero">
        <p className="eyebrow">Marketplace mentoring terverifikasi</p>
        <h1 className="hero__title">
          Temukan mentor akademik yang kredensialnya bisa Anda periksa sendiri.
        </h1>
        <p className="hero__lede">{copy.tagline}</p>
        <div className="search">
          <label className="visually-hidden" htmlFor="mentor-search">
            Cari nama mentor, topik, atau kampus
          </label>
          <span className="search__icon">
            <IconSearch size={20} />
          </span>
          <input
            id="mentor-search"
            type="search"
            className="input search__input"
            placeholder="Cari nama mentor, topik, atau kampus"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
          />
          {searchDraft && (
            <button
              type="button"
              className="search__clear"
              aria-label="Hapus pencarian"
              onClick={() => setSearchDraft('')}
            >
              ×
            </button>
          )}
        </div>
      </section>

      <section className="filters" aria-label="Filter pencarian">
        <div className="filters__group">
          <p className="filters__label">Bidang</p>
          <div className="chips">
            {facets.state.status === 'ready'
              ? facets.state.data.disciplines.map((facet) => (
                  <FilterChip
                    key={facet.value}
                    label={facet.label}
                    count={facet.count}
                    selected={filters.discipline.includes(facet.value)}
                    onClick={() => toggle('discipline', facet.value)}
                  />
                ))
              : facets.state.status === 'loading'
                ? ['a', 'b', 'c'].map((key) => (
                    <span key={key} className="skeleton chip-skeleton" />
                  ))
                : null}
          </div>
        </div>

        <div className="filters__group">
          <p className="filters__label">Jenjang</p>
          <div className="chips">
            {['S1', 'S2', 'S3'].map((level) => (
              <FilterChip
                key={level}
                label={level}
                selected={filters.degreeFocus.includes(level)}
                onClick={() => toggle('degreeFocus', level)}
              />
            ))}
          </div>
        </div>

        <div className="filters__group">
          <p className="filters__label">Tier</p>
          <div className="chips">
            {(['BASIC', 'EDUCATOR_STANDARD', 'EDUCATOR_PREMIUM'] as const).map((tier) => (
              <FilterChip
                key={tier}
                label={config?.tierLabels[tier] ?? tier}
                selected={filters.tier.includes(tier)}
                onClick={() => toggle('tier', tier)}
              />
            ))}
          </div>
        </div>

        <div className="filters__group">
          <p className="filters__label">Tujuan studi luar negeri</p>
          <div className="chips">
            {Object.entries(destinations).map(([code, label]) => (
              <FilterChip
                key={code}
                label={label}
                selected={filters.destination.includes(code)}
                onClick={() => toggle('destination', code)}
              />
            ))}
          </div>
        </div>

        <div className="filters__group">
          <p className="filters__label">Honor sesi maksimum</p>
          <div className="chips">
            {[0, 250000, 500000].map((amount) => (
              <FilterChip
                key={amount}
                label={amount === 0 ? 'Konsultasi gratis' : `≤ ${formatRupiah(amount)}`}
                selected={filters.maxFeeIdr === String(amount)}
                onClick={() =>
                  update({ maxFeeIdr: filters.maxFeeIdr === String(amount) ? '' : String(amount) })
                }
              />
            ))}
          </div>
        </div>
      </section>

      {activeChips.length > 0 && (
        <div className="active-filters">
          <ul className="active-filters__list" aria-label="Filter aktif">
            {activeChips.map((chip) => (
              <li key={chip.label}>
                <button type="button" className="active-chip" onClick={chip.clear}>
                  {chip.label}
                  <span aria-hidden="true">×</span>
                  <span className="visually-hidden">Hapus filter</span>
                </button>
              </li>
            ))}
          </ul>
          <Button variant="ghost" size="sm" onClick={clearAll}>
            {copy.clearFilters}
          </Button>
        </div>
      )}

      <section aria-busy={list.state.status === 'loading'}>
        <div className="results-head">
          <p className="results-count" aria-live="polite">
            {list.state.status === 'ready'
              ? `${total} mentor ditemukan`
              : list.state.status === 'loading'
                ? 'Memuat…'
                : '—'}
          </p>
          <label className="select-inline">
            <span>Urutkan</span>
            <select
              className="input input--select input--compact"
              value={filters.sort}
              onChange={(event) => update({ sort: event.target.value })}
            >
              <option value="relevance">Relevansi</option>
              <option value="price_asc">Honor terendah</option>
              <option value="price_desc">Honor tertinggi</option>
              <option value="rating">Bimbingan Akademik tertinggi</option>
            </select>
          </label>
        </div>

        {list.state.status === 'loading' && (
          <div className="grid grid--cards">
            {Array.from({ length: 6 }, (_, index) => (
              <MentorCardSkeleton key={index} />
            ))}
          </div>
        )}

        {list.state.status === 'error' && (
          <ErrorRetry
            message={`Gagal memuat daftar mentor. ${list.state.message}`}
            onRetry={list.reload}
          />
        )}

        {list.state.status === 'ready' && items.length === 0 && (
          <EmptyState
            title={copy.emptyZeroResults}
            body={copy.emptyZeroResultsBody}
            action={
              <Button variant="secondary" onClick={clearAll}>
                {copy.clearFilters}
              </Button>
            }
          />
        )}

        {items.length > 0 && (
          <div className="grid grid--cards">
            {items.map((mentor) => (
              <MentorCardView key={mentor.id} mentor={mentor} />
            ))}
          </div>
        )}

        {total > items.length && (
          <div className="load-more">
            <Button
              variant="secondary"
              onClick={() => void loadMore()}
              loading={loadingMore}
              loadingLabel="Memuat…"
            >
              Muat lebih banyak
            </Button>
            <span className="visually-hidden" aria-live="polite">
              Menampilkan {items.length} dari {total}
            </span>
            {loadMoreError && <p className="field__error">{loadMoreError}</p>}
          </div>
        )}
      </section>
    </div>
  );
}
