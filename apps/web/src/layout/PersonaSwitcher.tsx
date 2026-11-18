import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { demoAccounts, roleLabel } from '../demo/accounts';
import { Banner } from '../components/Banner';
import { Avatar } from '../components/Indicators';
import { IconChevronDown, IconClose, IconMenu } from '../components/Icons';
import { useToast } from '../components/Toast';

/** X1 — persona switcher. Signs in as a seeded account with no password step. */
export function PersonaSwitcher() {
  const { session, login, logout } = useSession();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node))
        setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (session.phase !== 'authenticated') {
    return (
      <Link className="btn btn--secondary btn--sm" to="/masuk">
        {demoAccounts.length > 0 ? 'Masuk' : 'Masuk'}
      </Link>
    );
  }

  const me = session.me;

  async function switchTo(email: string) {
    setPendingEmail(email);
    setError(null);
    try {
      const next = await login(email);
      const account = demoAccounts.find((item) => item.email === email);
      showToast(`Beralih ke ${account?.name ?? next.user.email}`);
      setOpen(false);
      if (next.user.role === 'MENTEE') navigate('/booking');
      else if (next.user.role === 'MENTOR') navigate('/mentor/dashboard');
      else navigate('/admin/verifikasi');
    } catch {
      setError('Gagal beralih akun.');
    } finally {
      setPendingEmail(null);
    }
  }

  return (
    <div className="persona" ref={containerRef}>
      <button
        type="button"
        className="persona__trigger"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
      >
        <Avatar name={me.user.email.split('@')[0] ?? 'Akun'} size={32} />
        <span className="persona__meta">
          <span className="persona__name">{me.user.email}</span>
          <span className="persona__role">{roleLabel(me.user.role)}</span>
        </span>
        <IconChevronDown size={18} />
      </button>

      {open && (
        <div className="persona__panel" role="dialog" aria-label="Pilih akun demo">
          <div className="persona__head">
            <p className="persona__title">Akun demo</p>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(false)}
              aria-label="Tutup"
            >
              <IconClose size={18} />
            </button>
          </div>
          {error && <Banner variant="danger">{error}</Banner>}
          {(['MENTEE', 'MENTOR', 'ADMIN'] as const).map((role) => (
            <div className="persona__group" key={role}>
              <p className="persona__group-title">{roleLabel(role)}</p>
              {demoAccounts
                .filter((account) => account.role === role)
                .map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    className={`persona__option${account.email === me.user.email ? ' is-active' : ''}`}
                    onClick={() => void switchTo(account.email)}
                    aria-busy={pendingEmail === account.email || undefined}
                    disabled={pendingEmail !== null}
                  >
                    <Avatar name={account.name} size={28} />
                    <span className="persona__option-text">
                      <span className="persona__option-name">{account.name}</span>
                      <span className="persona__option-state">{account.state}</span>
                      <span className="persona__option-email">{account.email}</span>
                    </span>
                    {pendingEmail === account.email && (
                      <span className="persona__spinner" aria-hidden="true" />
                    )}
                  </button>
                ))}
            </div>
          ))}
          <div className="persona__foot">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => {
                void logout().then(() => navigate('/'));
                setOpen(false);
              }}
            >
              Keluar
            </button>
            <Link className="persona__foot-link" to="/masuk" onClick={() => setOpen(false)}>
              Halaman masuk
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function MobileNav({ links }: { links: { to: string; label: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-nav">
      <button
        type="button"
        className="icon-btn"
        aria-expanded={open}
        aria-label="Buka menu"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <IconClose size={22} /> : <IconMenu size={22} />}
      </button>
      {open && (
        <nav className="mobile-nav__panel" aria-label="Navigasi utama">
          {links.map((link) => (
            <Link key={link.to} to={link.to} onClick={() => setOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
