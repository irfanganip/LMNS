import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, api, errorMessage } from '../../api/client';
import type { AlignmentCard, AlignmentItem, Booking, Thread } from '../../api/types';
import { useSession } from '../../auth/SessionProvider';
import { Banner } from '../../components/Banner';
import { Button } from '../../components/Button';
import { ErrorRetry } from '../../components/EmptyState';
import { SelectField, TextField } from '../../components/Field';
import { IconClock, IconError, IconInfo } from '../../components/Icons';
import { StatusPill } from '../../components/Indicators';
import { SkeletonLines } from '../../components/Skeleton';
import { useToast } from '../../components/Toast';
import { copy, formatDateTime, formatRupiah, interpolate } from '../../copy/id';
import { useApi } from '../../hooks/useApi';

type PendingMessage = { body: string; failed: boolean };

export function MediationRoomScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { session } = useSession();
  const { showToast } = useToast();
  const thread = useApi<Thread>(`/bookings/${id}/thread`);
  const booking = useApi<Booking>(`/bookings/${id}`);
  const [draft, setDraft] = useState('');
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const role = session.phase === 'authenticated' ? session.me.user.role : 'MENTEE';
  const myId = session.phase === 'authenticated' ? session.me.user.id : '';
  const counterpart =
    thread.state.status === 'ready'
      ? thread.state.data.participants.find((participant) => participant.id !== myId)
      : null;

  useEffect(() => {
    if (thread.state.status !== 'ready') return;
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [thread.state]);

  const locked =
    thread.state.status === 'error' &&
    thread.state.error instanceof ApiError &&
    thread.state.error.status === 402;
  const forbidden =
    thread.state.status === 'error' &&
    thread.state.error instanceof ApiError &&
    thread.state.error.status === 403;

  if (thread.state.status === 'loading') {
    return (
      <div className="card">
        <SkeletonLines lines={6} />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="stack narrow">
        <Banner variant="warning" title="Ruang mediasi terkunci">
          {copy.alignLockedUnpaid}
        </Banner>
        {role === 'MENTEE' ? (
          <Button onClick={() => navigate(`/booking/${id}/pembayaran`)}>
            Bayar biaya platform
          </Button>
        ) : (
          <Button onClick={() => navigate('/mentor/permintaan')}>Lihat permintaan masuk</Button>
        )}
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="stack narrow">
        <Banner variant="danger" title="Akses ditolak">
          Ruang mediasi hanya dapat dibuka oleh mentee dan mentor pada booking ini.
        </Banner>
        <Button variant="secondary" onClick={() => navigate('/')}>
          {copy.home}
        </Button>
      </div>
    );
  }

  if (thread.state.status === 'error') {
    return (
      <ErrorRetry
        message={`Ruang mediasi gagal dimuat. ${thread.state.message}`}
        onRetry={thread.reload}
      />
    );
  }

  const data = thread.state.data;
  const alignment = data.alignment;
  const allConfirmed = alignment.status === 'CONFIRMED';

  async function send(body: string) {
    if (!body.trim()) return;
    setSending(true);
    setDraft('');
    try {
      await api(`/bookings/${id}/messages`, { method: 'POST', body: { body: body.trim() } });
      setPending((queue) => queue.filter((item) => item.body !== body));
      thread.reload();
    } catch {
      setPending((queue) => [
        ...queue.filter((item) => item.body !== body),
        { body, failed: true },
      ]);
      setDraft(body);
    } finally {
      setSending(false);
    }
  }

  function onAlignmentUpdated(next: AlignmentCard) {
    thread.setData((current) => (current ? { ...current, alignment: next } : current));
    booking.reload();
  }

  return (
    <div className="stack stack--lg">
      <nav className="breadcrumb" aria-label="Remah roti">
        <Link to={role === 'MENTOR' ? '/mentor/permintaan' : '/booking'}>
          {role === 'MENTOR' ? copy.nav.incoming : copy.nav.myBookings}
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Ruang mediasi</span>
      </nav>

      <header className="page-head">
        <div>
          <h1 className="page-title">
            {copy.alignTitle} · {counterpart?.displayName ?? 'Ruang mediasi'}
          </h1>
          <p className="muted">
            {booking.state.status === 'ready' && <StatusPill status={booking.state.data.status} />}{' '}
            {allConfirmed ? copy.alignConfirmed : copy.alignSubtitle}
          </p>
        </div>
      </header>

      {allConfirmed && (
        <Banner variant="success" title="Kesepakatan lengkap">
          {copy.alignConfirmed}
        </Banner>
      )}

      <div className="mediation">
        <section className="card mediation__thread" aria-labelledby="thread-title">
          <div className="card__head">
            <h2 className="card__title" id="thread-title">
              Percakapan
            </h2>
            <span className="muted small">{data.messages.length} pesan</span>
          </div>

          <p className="contact-policy">
            <IconInfo size={14} /> {data.contactPolicy}
          </p>

          <div
            className="thread"
            ref={listRef}
            role="log"
            aria-live="polite"
            aria-label="Pesan percakapan"
          >
            {data.messages.length === 0 && pending.length === 0 && (
              <p className="muted empty-thread">
                {role === 'MENTOR' ? copy.alignEmptyThreadMentor : copy.alignEmptyThread}
              </p>
            )}

            {data.messages.map((message) => {
              const mine = message.senderId === myId;
              return (
                <article key={message.id} className={`bubble${mine ? ' bubble--mine' : ''}`}>
                  <div className="bubble__meta">
                    <span className="bubble__author">
                      {mine
                        ? 'Anda'
                        : (data.participants.find((p) => p.id === message.senderId)?.displayName ??
                          'Peserta')}
                    </span>
                    <time className="muted small" dateTime={message.createdAt}>
                      {formatDateTime(message.createdAt)}
                    </time>
                  </div>
                  <p className="bubble__body">{message.body}</p>
                </article>
              );
            })}

            {pending.map((message) => (
              <article key={message.body} className="bubble bubble--mine bubble--failed">
                <div className="bubble__meta">
                  <span className="bubble__author">Anda</span>
                  <span className="muted small">
                    <IconError size={12} /> {copy.alignMessageFailed}
                  </span>
                </div>
                <p className="bubble__body">{message.body}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setPending((queue) => queue.filter((item) => item.body !== message.body));
                    void send(message.body);
                  }}
                >
                  Kirim ulang
                </Button>
              </article>
            ))}
          </div>

          <form
            className="composer"
            onSubmit={(event) => {
              event.preventDefault();
              void send(draft);
            }}
          >
            <label className="visually-hidden" htmlFor="composer">
              Tulis pesan
            </label>
            <textarea
              id="composer"
              className="input input--textarea composer__input"
              rows={3}
              maxLength={2000}
              placeholder="Tulis pesan untuk menyepakati ruang lingkup, jadwal, dan honor…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                // Enter-to-send is deliberately off: a mis-send in mediation cannot be undone.
                if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                  event.preventDefault();
                  void send(draft);
                }
              }}
              disabled={sending}
            />
            <div className="composer__foot">
              <span className="muted small">{draft.length}/2000</span>
              <Button
                type="submit"
                loading={sending}
                loadingLabel="Mengirim…"
                disabled={!draft.trim()}
              >
                Kirim
              </Button>
            </div>
          </form>
        </section>

        <aside className="card mediation__alignment" aria-labelledby="alignment-title">
          <div className="card__head">
            <h2 className="card__title" id="alignment-title">
              {copy.alignTitle}
            </h2>
            <span className="badge badge--muted">v{alignment.version}</span>
          </div>
          <p className="muted small">{copy.alignSubtitle}</p>

          <ul className="alignment">
            {alignment.items.map((item) => (
              <AlignmentItemRow
                key={item.key}
                bookingId={id}
                item={item}
                myRole={role === 'MENTOR' ? 'mentor' : 'mentee'}
                counterpartName={counterpart?.displayName ?? 'pihak lain'}
                onUpdated={onAlignmentUpdated}
                onConfirmed={(card, scheduled) => {
                  onAlignmentUpdated(card);
                  if (scheduled) {
                    showToast(copy.alignConfirmed);
                    booking.reload();
                  }
                }}
              />
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}

function describeValue(item: AlignmentItem): string[] {
  const value = item.value ?? {};
  if (item.key === 'scope') {
    const text = typeof value.text === 'string' ? value.text : '';
    return text ? [text] : [];
  }
  if (item.key === 'schedule') {
    const lines: string[] = [];
    if (typeof value.startsAt === 'string') lines.push(formatDateTime(value.startsAt));
    if (typeof value.durationMinutes === 'number') lines.push(`${value.durationMinutes} menit`);
    if (typeof value.videoUrl === 'string' && value.videoUrl) lines.push(value.videoUrl);
    return lines;
  }
  const lines: string[] = [];
  if (typeof value.amountIdr === 'number') lines.push(formatRupiah(value.amountIdr));
  if (typeof value.method === 'string') {
    const methods: Record<string, string> = {
      FREE_CONSULTATION: 'Konsultasi gratis',
      BANK_TRANSFER: 'Transfer bank',
      EWALLET: 'E-wallet',
      CASH: 'Tunai',
    };
    lines.push(methods[value.method] ?? value.method);
  }
  if (typeof value.settlementNote === 'string' && value.settlementNote)
    lines.push(value.settlementNote);
  return lines;
}

function isComplete(item: AlignmentItem): boolean {
  const value = item.value ?? {};
  if (item.key === 'scope') return typeof value.text === 'string' && value.text.trim().length > 0;
  if (item.key === 'schedule') {
    return (
      typeof value.startsAt === 'string' &&
      value.startsAt !== '' &&
      typeof value.durationMinutes === 'number'
    );
  }
  return typeof value.amountIdr === 'number' && typeof value.method === 'string';
}

function AlignmentItemRow({
  bookingId,
  item,
  myRole,
  counterpartName,
  onUpdated,
  onConfirmed,
}: {
  bookingId: string;
  item: AlignmentItem;
  myRole: 'mentee' | 'mentor';
  counterpartName: string;
  onUpdated: (card: AlignmentCard) => void;
  onConfirmed: (card: AlignmentCard, scheduled: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const value = item.value ?? {};
  const [text, setText] = useState(typeof value.text === 'string' ? value.text : '');
  const [startsAt, setStartsAt] = useState(
    typeof value.startsAt === 'string' ? toLocalInput(value.startsAt) : '',
  );
  const [durationMinutes, setDurationMinutes] = useState(
    typeof value.durationMinutes === 'number' ? String(value.durationMinutes) : '60',
  );
  const [videoUrl, setVideoUrl] = useState(
    typeof value.videoUrl === 'string' ? value.videoUrl : '',
  );
  const [amountIdr, setAmountIdr] = useState(
    typeof value.amountIdr === 'number' ? String(value.amountIdr) : '0',
  );
  const [method, setMethod] = useState(
    typeof value.method === 'string' ? value.method : 'FREE_CONSULTATION',
  );
  const [settlementNote, setSettlementNote] = useState(
    typeof value.settlementNote === 'string' ? value.settlementNote : '',
  );

  const complete = isComplete(item);
  const myConfirmed = item.confirmations[myRole];
  const otherConfirmed = item.confirmations[myRole === 'mentee' ? 'mentor' : 'mentee'];
  const lines = describeValue(item);

  const statusLabel = useMemo(() => {
    if (item.confirmed) return copy.alignAgreed;
    if (otherConfirmed && !myConfirmed) return copy.alignWaitingYou;
    if (myConfirmed && !otherConfirmed)
      return interpolate(copy.alignWaitingThem, { nama: counterpartName });
    return copy.alignWaiting;
  }, [item.confirmed, myConfirmed, otherConfirmed, counterpartName]);

  function body(): Record<string, unknown> {
    if (item.key === 'scope') return { text: text.trim() };
    if (item.key === 'schedule') {
      return {
        startsAt: new Date(startsAt).toISOString(),
        durationMinutes: Number(durationMinutes),
        videoUrl: videoUrl.trim() || null,
      };
    }
    return {
      amountIdr: Number(amountIdr),
      method,
      settlementNote: settlementNote.trim() || null,
    };
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const card = await api<AlignmentCard>(`/bookings/${bookingId}/alignment/${item.key}`, {
        method: 'PUT',
        body: body(),
      });
      onUpdated(card);
      setEditing(false);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function confirm() {
    setConfirming(true);
    setError(null);
    try {
      const result = await api<{
        alignment: AlignmentCard;
        bookingStatus: string;
        allItemsConfirmed: boolean;
      }>(`/bookings/${bookingId}/alignment/${item.key}/confirm`, { method: 'POST' });
      onConfirmed(result.alignment, result.allItemsConfirmed);
    } catch (caught) {
      setError(
        caught instanceof ApiError && caught.code === 'THREAD_CLOSED'
          ? 'Ruang mediasi sudah ditutup.'
          : errorMessage(caught),
      );
    } finally {
      setConfirming(false);
    }
  }

  return (
    <li
      className={`alignment__item${item.confirmed ? ' is-confirmed' : ''}${!complete ? ' is-empty' : ''}`}
    >
      <div className="alignment__head">
        <h3 className="alignment__label">{item.label}</h3>
        <span className={`alignment__state${item.confirmed ? ' alignment__state--done' : ''}`}>
          {statusLabel}
        </span>
      </div>

      {lines.length > 0 ? (
        <ul className="alignment__value">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="muted small">{copy.alignBlocked}</p>
      )}

      {!item.confirmed && complete && (
        <div className="alignment__confirm-row">
          <Button
            size="sm"
            variant={myConfirmed ? 'secondary' : 'primary'}
            onClick={() => void confirm()}
            loading={confirming}
            loadingLabel="Menyimpan…"
            disabled={myConfirmed}
          >
            {myConfirmed ? 'Sudah Anda konfirmasi' : copy.alignConfirm}
          </Button>
          <span className="muted small">
            <IconClock size={12} /> v{item.version} · {item.proposedBy ? 'diubah' : 'draf'}{' '}
            {formatDateTime(item.proposedAt)}
          </span>
        </div>
      )}

      {error && (
        <p className="field__error" role="alert">
          {error}
        </p>
      )}

      <div className="alignment__edit">
        {!editing ? (
          <button type="button" className="link-btn" onClick={() => setEditing(true)}>
            {complete ? 'Ubah butir ini' : 'Isi butir ini'}
          </button>
        ) : (
          <div className="stack stack--sm">
            {item.key === 'scope' && (
              <TextField
                id={`${item.key}-text`}
                label="Ruang lingkup"
                value={text}
                onChange={(event) => setText(event.target.value)}
                help="Tuliskan apa yang akan dibahas dan hasil yang diharapkan."
                disabled={saving}
              />
            )}
            {item.key === 'schedule' && (
              <>
                <TextField
                  id="schedule-startsAt"
                  label="Mulai"
                  type="datetime-local"
                  value={startsAt}
                  onChange={(event) => setStartsAt(event.target.value)}
                  help="Minimal 1 jam dari sekarang."
                  disabled={saving}
                />
                <TextField
                  id="schedule-duration"
                  label="Durasi (menit)"
                  type="number"
                  min={15}
                  max={240}
                  value={durationMinutes}
                  onChange={(event) => setDurationMinutes(event.target.value)}
                  disabled={saving}
                />
                <TextField
                  id="schedule-videoUrl"
                  label="Tautan pertemuan"
                  type="url"
                  placeholder="https://meet.example.com/…"
                  value={videoUrl}
                  onChange={(event) => setVideoUrl(event.target.value)}
                  disabled={saving}
                />
              </>
            )}
            {item.key === 'fee' && (
              <>
                <TextField
                  id="fee-amount"
                  label="Jumlah honor (IDR)"
                  type="number"
                  min={0}
                  max={10000000}
                  step={1000}
                  value={amountIdr}
                  onChange={(event) => setAmountIdr(event.target.value)}
                  disabled={saving}
                />
                <SelectField
                  id="fee-method"
                  label="Metode"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  disabled={saving}
                >
                  <option value="FREE_CONSULTATION">Konsultasi gratis</option>
                  <option value="BANK_TRANSFER">Transfer bank</option>
                  <option value="EWALLET">E-wallet</option>
                  <option value="CASH">Tunai</option>
                </SelectField>
                <TextField
                  id="fee-note"
                  label="Catatan pembayaran"
                  value={settlementNote}
                  onChange={(event) => setSettlementNote(event.target.value)}
                  help="Honor dibayar langsung ke mentor, di luar platform."
                  disabled={saving}
                />
              </>
            )}
            <div className="form-actions">
              <Button
                size="sm"
                onClick={() => void save()}
                loading={saving}
                loadingLabel="Menyimpan…"
              >
                {copy.save}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
                {copy.cancel}
              </Button>
            </div>
            <p className="muted small">{copy.alignEdited}</p>
          </div>
        )}
      </div>
    </li>
  );
}

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}
