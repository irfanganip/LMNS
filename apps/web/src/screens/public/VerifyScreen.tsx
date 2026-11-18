import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api, errorMessage, setToken } from '../../api/client';
import type { MenteeProfile, User } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { demoOtp } from '../../demo/accounts';
import { copy } from '../../copy/id';

type LocationState = { email?: string; demoOtp?: string; fromRegister?: boolean } | null;

export function VerifyScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { refreshMe, session } = useSession();
  const state = location.state as LocationState;
  const email = state?.email ?? (session.phase === 'authenticated' ? session.me.user.email : '');
  const code = state?.demoOtp ?? demoOtp;

  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [demoCode, setDemoCode] = useState(code);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  const otp = digits.join('');
  const complete = otp.length === 6 && digits.every((digit) => digit !== '');

  function setDigit(index: number, value: string) {
    const clean = value.replace(/\D/g, '');
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split('');
      const filled = [...digits];
      next.forEach((digit, offset) => {
        if (index + offset < 6) filled[index + offset] = digit;
      });
      setDigits(filled);
      refs.current[Math.min(index + next.length, 5)]?.focus();
      return;
    }
    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    if (clean && index < 5) refs.current[index + 1]?.focus();
  }

  function onKeyDown(index: number, event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      event.preventDefault();
      refs.current[index - 1]?.focus();
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!complete) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await api<{ token: string; user: User; menteeProfile: MenteeProfile }>(
        '/auth/register/verify',
        { method: 'POST', body: { email, otp } },
      );
      setToken(result.token);
      await refreshMe();
      navigate('/onboarding/profil', { replace: true });
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSubmitting(false);
    }
  }

  async function resend() {
    setResendState('sending');
    setError(null);
    try {
      const result = await api<{
        expiresAt: string;
        demoOtp: string | null;
        resendsRemaining: number;
      }>('/auth/otp/resend', { method: 'POST', body: { email } });
      setResendState('sent');
      if (result.demoOtp) setDemoCode(result.demoOtp);
    } catch (caught) {
      setResendState('idle');
      setError(errorMessage(caught));
    }
  }

  if (!email) {
    return (
      <div className="auth-page">
        <div className="card auth-card">
          <h1 className="auth-card__title">Verifikasi email</h1>
          <Banner variant="warning" title="Email belum diketahui">
            Mulai dari halaman daftar agar kami tahu alamat email yang perlu diverifikasi.
          </Banner>
          <Button onClick={() => navigate('/daftar')} fullWidth>
            Ke halaman daftar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-card__title">Masukkan kode verifikasi</h1>
        <p className="muted">
          Kami mengirim 6 digit ke <strong>{email}</strong>.
        </p>

        <Banner variant="info" title="Mode demo">
          Kode verifikasi demo: <strong className="mono">{demoCode}</strong>
        </Banner>

        {error && (
          <Banner variant="danger" title="Kode tidak diterima">
            {error}
          </Banner>
        )}

        <form className="stack" onSubmit={(event) => void onSubmit(event)}>
          <fieldset className="otp">
            <legend className="field__label">Kode 6 digit</legend>
            <div className="otp__inputs">
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    refs.current[index] = element;
                  }}
                  className="input otp__input"
                  inputMode="numeric"
                  autoComplete={index === 0 ? 'one-time-code' : 'off'}
                  maxLength={6}
                  value={digit}
                  aria-label={`Digit ${index + 1}`}
                  onChange={(event) => setDigit(index, event.target.value)}
                  onKeyDown={(event) => onKeyDown(index, event)}
                  disabled={submitting}
                />
              ))}
            </div>
          </fieldset>

          <Button
            type="submit"
            loading={submitting}
            loadingLabel="Memverifikasi…"
            disabled={!complete}
            fullWidth
          >
            Verifikasi
          </Button>
        </form>

        <div className="auth-card__foot">
          <span className="muted">Belum menerima kode?</span>{' '}
          <button
            type="button"
            className="link-btn"
            onClick={() => void resend()}
            disabled={resendState === 'sending'}
          >
            {resendState === 'sending'
              ? 'Mengirim ulang…'
              : resendState === 'sent'
                ? 'Kode dikirim ulang'
                : 'Kirim ulang kode'}
          </button>
        </div>
        <p className="muted small">{copy.otpExpiry}</p>
      </div>
    </div>
  );
}
