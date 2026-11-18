import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { IconChevronRight } from '../../components/Icons';
import { demoAccounts, roleLabel } from '../../demo/accounts';
import { copy } from '../../copy/id';

function landingFor(role: 'MENTEE' | 'MENTOR' | 'ADMIN'): string {
  if (role === 'MENTEE') return '/booking';
  if (role === 'MENTOR') return '/mentor/dashboard';
  return '/admin/verifikasi';
}

export function SignInScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { session, login, config } = useSession();
  const [email, setEmail] = useState('');
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const next = params.get('next');

  useEffect(() => {
    if (session.phase !== 'authenticated') return;
    navigate(next ?? landingFor(session.me.user.role), { replace: true });
  }, [session, next, navigate]);

  async function signIn(value: string) {
    setPending(value);
    setError(null);
    try {
      const me = await login(value);
      navigate(next ?? landingFor(me.user.role), { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-card__title">Masuk</h1>
        <p className="muted">
          Prototipe ini memakai email kampus tanpa kata sandi. Pilih akun demo atau masukkan email
          Anda.
        </p>

        {error && (
          <Banner variant="danger" title="Tidak dapat masuk">
            {error}
          </Banner>
        )}

        <form
          className="stack"
          onSubmit={(event) => {
            event.preventDefault();
            void signIn(email.trim());
          }}
        >
          <label className="field">
            <span className="field__label">
              Email kampus{' '}
              <span className="field__required" aria-hidden="true">
                *
              </span>
            </span>
            <input
              className="input"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@kampus.ac.id"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending !== null}
            />
          </label>
          <Button
            type="submit"
            loading={pending === email && email !== ''}
            loadingLabel="Masuk…"
            disabled={pending !== null || !email}
            fullWidth
          >
            Masuk
          </Button>
        </form>

        <div className="auth-divider" role="presentation">
          <span>{copy.demoAccountsLabel}</span>
        </div>

        <ul className="demo-list">
          {demoAccounts.map((account) => (
            <li key={account.email}>
              <button
                type="button"
                className="demo-row"
                onClick={() => void signIn(account.email)}
                disabled={pending !== null}
                aria-busy={pending === account.email || undefined}
              >
                <span className="demo-row__text">
                  <span className="demo-row__name">{account.name}</span>
                  <span className="muted small">{account.state}</span>
                  <span className="demo-row__email mono">{account.email}</span>
                </span>
                <span className="demo-row__role">{roleLabel(account.role)}</span>
                <IconChevronRight size={18} />
              </button>
            </li>
          ))}
        </ul>

        {config?.demoMode && <p className="muted small">{copy.demoNotice}</p>}
      </div>
    </div>
  );
}
