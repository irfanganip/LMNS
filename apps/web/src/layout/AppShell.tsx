import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { copy } from '../copy/id';
import { Banner } from '../components/Banner';
import { MobileNav, PersonaSwitcher } from './PersonaSwitcher';

function navLinks(role: 'MENTEE' | 'MENTOR' | 'ADMIN' | null) {
  if (role === 'MENTEE') {
    return [
      { to: '/', label: copy.nav.discover },
      { to: '/booking', label: copy.nav.myBookings },
    ];
  }
  if (role === 'MENTOR') {
    return [
      { to: '/mentor/dashboard', label: copy.nav.mentorDashboard },
      { to: '/mentor/permintaan', label: copy.nav.incoming },
      { to: '/mentor/studio', label: copy.nav.studio },
      { to: '/mentor/premium', label: copy.nav.premium },
    ];
  }
  if (role === 'ADMIN') {
    return [
      { to: '/admin/verifikasi', label: copy.nav.queue },
      { to: '/admin/badge', label: copy.nav.badges },
    ];
  }
  return [
    { to: '/', label: copy.nav.discover },
    { to: '/masuk', label: copy.nav.signIn },
    { to: '/daftar', label: copy.nav.register },
  ];
}

export function AppShell({ children }: { children: ReactNode }) {
  const { session, configError, reloadConfig } = useSession();
  const role = session.phase === 'authenticated' ? session.me.user.role : null;
  const links = navLinks(role);
  const isConsole = role === 'MENTOR' || role === 'ADMIN';

  return (
    <div className={`shell${isConsole ? ' shell--console' : ''}`}>
      <a className="skip-link" href="#konten">
        Langsung ke konten
      </a>
      <header className="appbar">
        <div className="appbar__inner">
          <div className="appbar__left">
            <MobileNav links={links} />
            <Link to="/" className="wordmark" aria-label="LMNS — beranda">
              LMNS
            </Link>
          </div>
          <nav className="appbar__nav" aria-label="Navigasi utama">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `appbar__link${isActive ? ' appbar__link--active' : ''}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="appbar__right">
            <PersonaSwitcher />
          </div>
        </div>
      </header>

      {configError && (
        <div className="shell__notice">
          <Banner
            variant="warning"
            title="Konfigurasi produk tidak dapat dimuat"
            action={
              <button type="button" className="btn btn--secondary btn--sm" onClick={reloadConfig}>
                {copy.retry}
              </button>
            }
          >
            Biaya platform dan label tier belum tersedia. Angka biaya tidak ditampilkan sampai
            konfigurasi termuat.
          </Banner>
        </div>
      )}

      <div className="shell__body">
        {isConsole && (
          <aside className="rail" aria-label="Navigasi konsol">
            <nav>
              {links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `rail__link${isActive ? ' rail__link--active' : ''}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}
        <main id="konten" className="page" tabIndex={-1}>
          {children}
        </main>
      </div>

      <footer className="footer">
        <p>{copy.notClinical}</p>
        <p className="footer__meta">Prototipe LMNS · data demo</p>
      </footer>
    </div>
  );
}
