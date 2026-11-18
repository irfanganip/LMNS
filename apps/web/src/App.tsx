import { useEffect, useState } from 'react';
import { loadBootstrap, type Health, type RuntimeConfig } from './api';

type State =
  | { phase: 'loading' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; health: Health; config: RuntimeConfig };

const rupiah = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

export function App() {
  const [state, setState] = useState<State>({ phase: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ phase: 'loading' });
    loadBootstrap(controller.signal)
      .then(([health, config]) => setState({ phase: 'ready', health, config }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          phase: 'error',
          message: error instanceof Error ? error.message : 'Gagal menghubungi server.',
        });
      });
    return () => controller.abort();
  }, [attempt]);

  return (
    <main className="page">
      <header className="masthead">
        <p className="eyebrow">LMNS · Prototipe</p>
        <h1>Mentoring akademik yang terverifikasi, dengan kesejahteraan mahasiswa di depan.</h1>
        <p className="lede">
          Kerangka aplikasi. Halaman ini membuktikan bahwa aplikasi web dan API berjalan bersama dan
          membaca konfigurasi produk dari satu sumber.
        </p>
      </header>

      {state.phase === 'loading' && (
        <section className="card" aria-busy="true">
          <p>Memeriksa koneksi ke API…</p>
        </section>
      )}

      {state.phase === 'error' && (
        <section className="card card--error" role="alert">
          <h2>API tidak dapat dihubungi</h2>
          <p>{state.message}</p>
          <p>Pastikan `npm run dev` berjalan, lalu coba lagi.</p>
          <button type="button" className="button" onClick={() => setAttempt((n) => n + 1)}>
            Coba lagi
          </button>
        </section>
      )}

      {state.phase === 'ready' && (
        <>
          <section className="card" aria-labelledby="status-heading">
            <div className="status-row">
              <span
                className={`badge ${state.health.status === 'ok' ? 'badge--ok' : 'badge--warn'}`}
              >
                {state.health.status === 'ok' ? 'API terhubung' : 'API terganggu'}
              </span>
              <span className="meta">
                {state.health.service} v{state.health.version}
              </span>
            </div>
            <h2 id="status-heading">Status data demo</h2>
            <dl className="stats">
              <div>
                <dt>Akun demo</dt>
                <dd>{state.health.database.users}</dd>
              </div>
              <div>
                <dt>Profil mentor</dt>
                <dd>{state.health.database.mentors}</dd>
              </div>
              <div>
                <dt>Seed terakhir</dt>
                <dd>{state.health.database.seededAt ? 'sudah di-seed' : 'belum di-seed'}</dd>
              </div>
            </dl>
            {!state.health.database.seededAt && (
              <p className="hint">Jalankan `npm run seed` untuk mengisi akun demo.</p>
            )}
          </section>

          <section className="card" aria-labelledby="config-heading">
            <h2 id="config-heading">Konfigurasi produk</h2>
            <p>
              Biaya platform per pemesanan:{' '}
              <strong>{rupiah.format(state.config.platformFeeIdr)}</strong>
            </p>
            <ul className="tier-list">
              {Object.entries(state.config.tierLabels).map(([key, label]) => (
                <li key={key}>
                  <span className="tier-key">{key}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <p className="meta">
              Domain email yang diterima: {state.config.allowedEmailDomains.join(', ')}
            </p>
            <p className="disclaimer">{state.config.disclaimer}</p>
          </section>
        </>
      )}
    </main>
  );
}
