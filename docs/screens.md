# LMNS Screens & States

Screen-by-screen specification for the prototype. Consumes the tokens and components in `docs/design-system.md`; covers exactly the inventory in `docs/prototype-scope.md` §4 and nothing beyond it.

**Sections:** §1 screen index · §2 screen specs · §3 state matrix · §4 Indonesian microcopy.

Every route below is indicative — the API contract in `docs/api-contract.md` owns data shapes, and the web app may nest routes differently. Screen *identifiers* (P1, M3, A2…) are the stable reference used by the build and by design QA.

---

## 1. Screen index

| ID | Screen | Story | Route (indicative) | Primary action |
|---|---|---|---|---|
| P1 | Marketplace / discovery with filters | US 3.1 | `/` | "Lihat profil" on a mentor card |
| P2 | Mentor promotional page | US 3.1 | `/mentor/[slug]` | "Ajukan sesi" |
| P3 | Register with campus email | US 1.1 | `/daftar` | "Kirim kode verifikasi" |
| P4 | Verify OTP | US 1.1 | `/verifikasi` | "Verifikasi" |
| P5 | Sign in | US 1.1 (D3) | `/masuk` | "Masuk" |
| M1 | Academic profile onboarding | US 1.1 | `/onboarding/profil` | "Lanjut ke pulse" |
| M2 | Well-being baseline pulse | US 1.2 | `/onboarding/pulse` | "Simpan jawaban" (or "Lewati") |
| M3 | Booking request + intake note | US 4.1 §Step 1 | `/booking/baru/[mentorId]` | "Lanjut ke pembayaran" |
| M4 | Checkout: platform fee + tier comparison | US 4.1, 4.2 | `/booking/[id]/pembayaran` | "Bayar biaya platform" |
| M5 | Payment status / retry | US 4.1 | `/booking/[id]/pembayaran/status` | "Coba lagi" / "Buka ruang mediasi" |
| M6 | My bookings | US 4.1, 5.1 | `/booking` | Context action per row ("Lanjutkan", "Nilai sesi") |
| M7 | Mediation room + alignment card | US 4.1 §Step 2/3 | `/booking/[id]/mediasi` | "Konfirmasi kesepakatan" |
| M8 | Review + mood check | US 5.1 | `/booking/[id]/ulasan` | "Kirim penilaian" |
| T1 | Mentor dashboard | US 2.1, 2.2 | `/mentor/dashboard` | "Lengkapi pengajuan" / "Kelola etalase" |
| T2 | Application wizard 1 — tier & evidence | US 2.1a | `/mentor/pengajuan/1` | "Lanjut" |
| T3 | Application wizard 2 — well-being self-assessment | US 2.1b | `/mentor/pengajuan/2` | "Simpan & lanjut" |
| T4 | Application wizard 3 — storefront builder + preview | US 2.1c | `/mentor/pengajuan/3` | "Kirim pengajuan" |
| T5 | Storefront studio (post-approval editor) | US 2.1c | `/mentor/studio` | "Simpan perubahan" |
| T6 | Premium upgrade, training & assessment | US 2.2 | `/mentor/premium` | "Mulai pelatihan" / "Kirim sertifikat" |
| T7 | Incoming bookings (mentor) | US 4.1 | `/mentor/permintaan` | "Buka ruang mediasi" |
| T8 | Mediation room — mentor variant | US 4.1 | `/mentor/mediasi/[id]` | "Konfirmasi kesepakatan" |
| A1 | Verification queue | US 5.2 | `/admin/verifikasi` | "Tinjau" on a row |
| A2 | Application detail, evidence & decision | US 5.2, 2.2 | `/admin/verifikasi/[id]` | "Setujui" / "Tolak" |
| A3 | Premium badge management | US 2.2, 5.2 | `/admin/badge` | "Terbitkan badge" / "Cabut badge" |
| X1 | Persona switcher (demo) | all | top app bar | Switch seeded account |
| X2 | Not found | shared | any unmatched route | "Kembali ke beranda" |

Nothing here introduces a screen, tab, or step that the 11 stories do not require. A new screen is a scope decision, not a design one.

---

## 2. Screen specifications

Conventions used below:

- **Data** lists what is rendered, not the API shape.
- **Nav in / out** names the concrete route or back behaviour.
- **States** is the minimum set; the matrix in §3 gives the copy/skeleton intent per state.
- All lists are API-driven and must be usable while loading, empty, partial, and failed.
- No screen renders a raw pulse answer, stress value, or mood answer to anyone but the mentee, and none renders a derived score or label back to the mentee.

### 2.1 Public

#### P1 — Marketplace / discovery with filters

- **Purpose:** let a mentee find verified mentors by discipline, degree focus, tier, and overseas destination, and reach a mentor page with enough trust signal to book.
- **Primary action:** open a mentor page ("Lihat profil").
- **Components:** top app bar (wordmark, sign-in, X1); hero band (`--text-3xl` desktop / `--text-2xl` phone) with one-line positioning; search input; filter chip groups (Bidang, Jenjang, Tier, Tujuan studi luar negeri); "Premium Well-Being" toggle chip with an info popover explaining added value; active-filter chip row with clear-all; result count; mentor card grid (§11.4); load-more button; empty state; skeletons; inline error banner.
- **Data per card:** avatar, name, academic title, institution, tier tag, badges (SISTER / Scopus-ORCID / Well-Being Certified — only those the mentor holds), research focus tags (max 4, "+2"), starting rate or "Konsultasi gratis", dual-axis rating summary (each axis separately, or "Belum ada ulasan"), languages, session formats.
- **Nav in:** landing/sign-in redirect, "Cari mentor" from empty mentee states, back from P2.
- **Nav out:** P2 (card), P5 (sign-in), P3 (register).
- **States:** loading (6 card skeletons + chip skeletons), success (results), empty-zero-result (filters preserved, clear-all), partial (some cards missing rating or rate → render "Belum ada ulasan" / "—", never a fake zero), error (banner + retry, filters preserved), filtered-loading (chips remain interactive, grid dims to skeletons, count shows spinner), unauthenticated (cards visible, primary CTA becomes "Masuk untuk mengajukan sesi" on P2 only).
- **Notes:** only verified, published mentors ever appear; pending/rejected mentors are absent rather than shown-with-label (US 3.1). Sort control is per-axis only, and its label always names the axis — there is no blended "rating" sort.

#### P2 — Mentor promotional page

- **Purpose:** let the mentee judge fit and trust — credentials, verified links, well-being philosophy, packages, and reviews — before spending.
- **Primary action:** "Ajukan sesi" (→ M3). For an unauthenticated visitor it becomes "Masuk untuk mengajukan sesi" (→ P5 with return path).
- **Components:** sticky mentor header card (96px avatar, name, title, institution, tier tag, badges with external links, language/format chips); "Tentang & filosofi pendampingan" prose block; "Keahlian & metode" tag list; package list (`--radius-md` rows: title, duration, price or "Konsultasi gratis", description); verified-links block (Google Scholar, LinkedIn, Scopus/ORCID, SISTER — each with an external-link icon and `rel="noopener noreferrer"`); reviews section (two independent axis summaries + review list with date and optional comment; no blended score); sticky booking panel on desktop (price basis, "Biaya platform Rp {fee} dibayar terpisah", CTA); info banner when the mentor is Premium explaining what certification means (only the perks the API reports as enforced).
- **Data:** storefront fields, packages, verified links, badge records, per-axis aggregates + counts, published reviews, platform fee from config.
- **Nav in:** P1 card, direct link, review list "kembali ke pencarian" (preserves filter state).
- **Nav out:** M3, P5, external verification records (new tab), P1.
- **States:** loading (header + 2 body skeletons), success, empty (mentor with no reviews → "Belum ada ulasan" per axis; no packages → "Belum ada paket"; section hidden only for packages, never for reviews), partial (one axis has reviews, the other does not), error (page-level banner + retry; header stays if cached), not-found (404 X2 with "Mentor tidak ditemukan"), unavailable (mentor unpublished mid-session → empty state "Etalase belum terbit" and CTA disabled with reason).
- **Notes:** no "hire me" urgency, no counters like "5 orang melihat profil ini". Premium perks copy must be identical to the enforced behaviour listed in `docs/design-system.md` §13.6.

#### P3 — Register with campus email

- **Purpose:** create a mentee account restricted to accredited Indonesian campus domains.
- **Primary action:** "Kirim kode verifikasi".
- **Components:** `--container-narrow` single column; screen title + one-line explanation of the student-only policy; fields: Nama lengkap, Email kampus, Kata sandi (with show/hide), Konfirmasi kata sandi; inline domain policy note under the email field ("Gunakan email resmi kampus, mis. nama@ui.ac.id"); primary button; secondary "Sudah punya akun? Masuk"; inline banner for duplicate registration; error summary banner on submit.
- **Data:** nothing fetched except optional domain policy hint; fee/OTP never shown here.
- **Nav in:** P5 ("Daftar"), P1 header.
- **Nav out:** P4 (success), P5 (existing account).
- **States:** default, field-error (invalid/blocked domain, weak password, mismatch — message under the exact field, form preserved), async-checking (spinner in email field while validating the domain), success (→ P4, email passed forward, masked), duplicate-account (banner: sign-in or reset instead of a second account, form preserved), server-error (banner + retry, values preserved), submitting (button loading, fields disabled with preserved values), rate-limited/blocked (banner naming the policy and what to do).

#### P4 — Verify OTP

- **Purpose:** turn an `Unverified` account into one that can book.
- **Primary action:** "Verifikasi".
- **Components:** narrow card; explanation "Kami mengirim 6 digit ke {email tersamarkan}"; 6-digit OTP input (single grouped field or six cells, paste-friendly, monospace, letter-spaced); "Kirim ulang" with countdown/limits; "Ubah email" ghost link; success banner on verification; resend feedback via toast.
- **Data:** masked email; demo-mode note: **the demo OTP is returned by the API** — the UI may display "Mode demo: kode 123456" in an info banner (`--surface-warm`). Never display a real OTP in production copy; label it as demo.
- **Nav in:** P3 success; any gated action redirect.
- **Nav out:** M1 (post-verification onboarding), P5.
- **States:** default, invalid-code (field error, attempt count not exposed as a threat), expired-code (recoverable error + resend, no re-entry of email), submitting (button loading, input read-only), success (banner → auto-redirect to M1 within 1.5s, plus a manual "Lanjut" for screen readers), rate-limited resend (ghost button disabled with helper "Coba lagi dalam 60 detik"), network error (banner + retry, code preserved).

#### P5 — Sign in

- **Purpose:** enter an existing account, including the seeded demo accounts.
- **Primary action:** "Masuk".
- **Components:** narrow card; email + password; "Masuk" primary; "Daftar" secondary; **demo account list** for the prototype (click-to-fill from config, labelled "Akun demo"); persona switcher X1 is also available post-login.
- **Data:** demo account list (email, role/tier label, demo state one-liner) from config/seed.
- **Nav in:** P1 header, P3, gated redirects.
- **Nav out:** role-based landing: mentee → M6 or P1, mentor → T1, admin → A1.
- **States:** default, invalid-credentials (field-independent error banner, no account enumeration), submitting (loading, fields locked), success (redirect), session-expired (banner "Sesi Anda berakhir. Silakan masuk kembali." with return path preserved), server-error (banner + retry), demo-data-missing (banner "Data demo belum dimuat. Jalankan `npm run seed`.").

### 2.2 Mentee

#### M1 — Academic profile onboarding

- **Purpose:** capture academic level, university, faculty/major, semester, and goals so matching has inputs, and mark the account complete.
- **Primary action:** "Lanjut ke pulse".
- **Components:** stepper (3 steps: Profil akademik · Pulse · Selesai, current = 1); form fields — Jenjang (segmented S1/S2/S3, required), Nama kampus (text), Fakultas/Jurusan (text), Semester (select 1–14), Tujuan utama (multi-select chips, enabled only after Jenjang is chosen); helper text under each; "Lewati" ghost for the pulse only; footer buttons "Lanjut ke pulse" (primary) and "Simpan draf" (secondary).
- **Data:** profile values; goal taxonomy from config; no fee data.
- **Nav in:** P4 success (first visit), M6 onboarding nudge.
- **Nav out:** M2, M6.
- **States:** default, prefilled-resume (draft restored, info banner "Draf Anda dipulihkan."), validation-error (per-field + summary, focus to first invalid), saving (button loading, form locked), save-error (banner + retry, values preserved), goals-blocked (Jenjang not chosen → goal group disabled with helper "Pilih jenjang terlebih dahulu."), previously-completed (fields editable, banner "Profil akademik Anda dapat diperbarui.").

#### M2 — Well-being baseline pulse

- **Purpose:** collect 3–5 private, skippable inputs (workload, blockers, preferred mentoring tone) used only for matching.
- **Primary action:** "Simpan jawaban".
- **Components:** narrow card; privacy statement at the top; 3–5 items — workload Likert (5 equal options), blocker single-select, preferred tone choice ("Lembut & menyemangati" / "Terstruktur & langsung"); non-clinical, no score; "Lewati untuk sekarang" ghost action of equal prominence; "Simpan jawaban" primary; footer disclaimer "LMNS bukan layanan kesehatan mental dan tidak menangani kondisi darurat."
- **Data:** prior answers (when re-prompted) preloaded; timestamp stored; **nothing** derived is rendered back.
- **Nav in:** M1, re-prompt entry from M6 (before a new booking), optional skip from M3.
- **Nav out:** M6/"Selesai" confirmation, or M3 when re-prompted mid-flow.
- **States:** default, skipped (onboarding continues; banner on next screen "Anda melewati pulse. Rekomendasi memakai tujuan akademik Anda."), resumed-with-history (banner "Jawaban sebelumnya tersimpan. Jawaban baru tidak menghapus riwayat."), partial-answers (allowed to save; nothing is required), validation-error (only if a required tone choice is missing — the pulse is otherwise optional), saving (loading), save-error (banner + retry, answers preserved), already-completed-today (info banner, fields shown read-only with "Perbarui" action).

#### M3 — Booking request + intake note

- **Purpose:** capture the session topic, academic bottleneck, and stress level, then hand off to payment.
- **Primary action:** "Lanjut ke pembayaran".
- **Components:** mentor summary strip (avatar, name, tier, package selected or "Sesi 60 menit", fee basis); intake form — Topik (text, required), Hambatan saat ini (textarea, required, 20–600 chars with counter), Tingkat beban saat ini (5 equal optional options, private note); selected package (if Premium, a radio list); info banner about what happens next (pay → mediation); primary/secondary buttons; `--container-narrow`.
- **Data:** mentor summary, package price basis, platform fee (from config, shown but not charged here), stress selection stored privately.
- **Nav in:** P2 CTA, package row on P2, M5 retry.
- **Nav out:** M4, back to P2.
- **States:** default, validation-error (per-field, focus to first invalid), package-required (no package chosen for a Premium mentor → inline error on the package group), unverified-account (blocking banner "Verifikasi email Anda untuk mengajukan sesi." + action to P4; submit disabled with reason), self-booking (mentor trying to book self → blocked state with reason), saving-draft (autosave indicator "Draf tersimpan"), submit-loading, submit-error (banner + retry, all values preserved, no duplicate booking created — idempotent).

#### M4 — Checkout: platform fee + tier comparison

- **Purpose:** disclose the platform fee and what it does *not* buy, show the session-fee basis, let the mentee pick a payment method, and compare what their tier includes.
- **Primary action:** "Bayar biaya platform".
- **Components:** order summary card (mentor, package/session, "Biaya platform LMNS Rp {fee}", "Honor sesi: dibayar langsung ke mentor" or "Rp 0 (gratis)"); fee disclosure block (§4.1 copy); "Bandingkan tier" secondary button opening the tier-comparison modal (US 4.2 — only enforced perks, unavailable perks marked "Tidak termasuk" and never styled as included); payment-method selector (QRIS / Virtual Account / E-wallet as one radio group with three logos-as-text labels); demo-mode banner "Pembayaran disimulasikan"; consent checkbox for the fee disclosure; primary CTA; "Kembali" ghost.
- **Data:** platform fee from config, tier of the selected mentor, enforced perk flags from API, provider list, booking reference.
- **Nav in:** M3 submit, M5 retry, M6 unpaid booking row.
- **Nav out:** M5 (status), M3 (back), M7 (on success).
- **States:** default, loading-summary (skeleton for summary + perk list), consent-unchecked (CTA disabled with helper "Centang pernyataan biaya untuk melanjutkan."), provider-unavailable (one method disabled with reason "Metode ini tidak tersedia pada demo."), submitting (CTA loading, provider locked, summary locked), payment-failed (→ M5 failure state; never opens the mediation thread), abandoned/expired (booking stays `UNPAID`, banner on return, retry path), already-paid (screen becomes a success confirmation with "Buka ruang mediasi"), comparison-modal loading/error (perks can fail independently without blocking payment).
- **Notes:** fee is read from config every render (D4); a negative test must prove the thread does not exist while unpaid.

#### M5 — Payment status / retry

- **Purpose:** resolve the payment outcome unambiguously and route to the thread on success.
- **Primary action:** "Buka ruang mediasi" on success; "Coba lagi" on failure.
- **Components:** status illustration (success check / warning clock / danger ×, 48px), headline, explanation, booking reference in mono, amount and provider recap, primary/secondary actions, "Lihat booking saya" ghost.
- **Data:** booking status, reference, amount, provider, timestamp.
- **Nav in:** M4 submit return, provider redirect simulation, M6 row.
- **Nav out:** M7 (success), M4 (retry), M6.
- **States:** processing (spinner + "Memeriksa pembayaran…", `aria-live` polite, polls at most 3×), success, failed (reason + retry, thread still closed), pending/timeout (warn banner "Pembayaran belum terkonfirmasi. Booking belum aktif." + retry + reference), expired (booking auto-`UNPAID`, "Ajukan ulang" path), error-checking (danger banner with retry, reference visible).

#### M6 — My bookings

- **Purpose:** the mentee's single place to see what needs action next and reach the thread or the review.
- **Primary action:** the contextual per-row action ("Bayar biaya platform" / "Buka ruang mediasi" / "Nilai sesi").
- **Components:** tabs/filters (Semua · Perlu tindakan · Terjadwal · Selesai); booking card list (mentor avatar + name, package, date/time, progressive status pill, alignment progress "2/3 butir disepakati", one context CTA + "Detail"); review prompt banner when a completed booking is unreviewed; empty state; skeletons; error retry.
- **Data:** bookings with status, alignment progress, next action, review eligibility, amount.
- **Nav in:** role landing, M5, M7/M8 back, review prompt.
- **Nav out:** M4, M7, M8, P2.
- **States:** loading (4 card skeletons), success, empty (no bookings → "Belum ada booking" + "Cari mentor"), filtered-empty ("Tidak ada booking di filter ini" + clear), partial (one row's mentor data fails → row renders with a compact "Gagal memuat data mentor" + retry, list still usable), error (banner + retry), review-available (prompt banner with "Nilai sesi" — the "+1 jam after completion" trigger is simulated by seeded data, since email is out of scope), unpaid (warn-styled row + pay CTA), one-sided (row label "Menunggu konfirmasi mentor" and CTA "Buka ruang mediasi").

#### M7 — Mediation room + alignment card

- **Purpose:** the product's core: agree scope, schedule, and direct settlement bilaterally, then schedule the session only when both parties confirmed all items.
- **Primary action:** "Konfirmasi kesepakatan".
- **Components:** gate state (unpaid → locked); two-column desktop layout (thread 1fr / alignment card 360px sticky), stacked on phone/tablet; thread: message list (sender, time, body), composer (textarea + "Kirim", Enter-to-send off by default to protect long Indonesian messages), system messages for state changes ("Kesepakatan butir 2 diperbarui. Konfirmasi ulang diperlukan."); alignment card: 3 items (scope & academic deliverables, schedule & video link, honor & direct settlement), each with a status line, an "Ubah" ghost action, and an edit form; overall confirm CTA with disabled reason; progress "x/3 disepakati"; success banner once `SCHEDULED`; fee/settlement disclosure footnote.
- **Data:** messages, three alignment items with per-party confirmation flags, session fee basis, mentor tier, booking status, platform-fee receipt reference.
- **Nav in:** M5 success, M6 row, T7 row (mentor).
- **Nav out:** M6, review entry after completion.
- **States:** locked-unpaid (gate empty state; composer and card inert), empty-thread ("Belum ada pesan. Sapa mentor dan isi butir kesepakatan."), editing-item (form expanded, other items dimmed but readable), item-incomplete (per-item validation: date must be future, link must be a URL, amount ≥ 0 or explicitly "Gratis"), one-sided (warn banner "Menunggu konfirmasi {nama}." and CTA becomes "Menunggu konfirmasi"), fully-confirmed (success banner + status `Terjadwal`, card read-only, "Ubah kesepakatan" secondary), re-confirm-required (warn banner after an edit, both confirmations reset), send-loading/failed (message remains in the composer with a retry, no duplicate on retry), thread-load-error (banner + retry, alignment card still operable if loaded independently), completed (post-session: card frozen, CTA becomes "Nilai sesi" for the mentee).

#### M8 — Review + mood check

- **Purpose:** capture the two independent ratings and an optional, private mood check.
- **Primary action:** "Kirim penilaian".
- **Components:** session summary strip (mentor, package, date); two rating groups (each: axis label, one-line helper, 5 stars input, anchor words, own error line); separation note "Dua aspek ini dinilai terpisah dan tidak digabungkan menjadi satu skor."; optional comment textarea with counter and a PII hint; submit; then the mood-check step (5 equal options + "Lewati"); thank-you state with privacy confirmation.
- **Data:** booking reference, mentor name, existing review (if any), submission state.
- **Nav in:** M6 review prompt or row, review reminder after a completed session.
- **Nav out:** M6.
- **States:** loading (skeleton of both rating groups), eligible, not-yet-eligible ("Penilaian tersedia satu jam setelah sesi selesai." + disabled form), already-reviewed (read-only summary of submitted values + "Terima kasih"), not-completed-booking (blocked: "Penilaian hanya untuk sesi yang sudah selesai."), validation-error (per-axis message, both required, focus to the first unrated axis), submitting (loading, inputs locked), submit-error (banner, values preserved), mood-step (after successful submit; optional), mood-skipped (completion without a mood answer), success (thank-you + privacy line, review visible on P2 per axis).

### 2.3 Mentor

#### T1 — Mentor dashboard

- **Purpose:** the mentor's home: application/storefront state, incoming work, premium status, and the next required action.
- **Primary action:** context-dependent — "Lengkapi pengajuan" / "Buka ruang mediasi" / "Kelola etalase".
- **Components:** status hero card (progressive status pill, tier label from config, SLA text when `PENDING_REVIEW`, primary CTA); checklist card ("Kelengkapan pengajuan" 4–6 items with done/pending states); counts row (permintaan masuk, sesi terjadwal, menunggu konfirmasi Anda); incoming booking preview (max 3, link to T7); premium panel (`--brand-tint`: current certification state, "Upgrade ke Premium Mentor" or outstanding-items checklist); storefront card (published state, "Lihat pratinjau", "Kelola etalase"); verification badges summary.
- **Data:** application status + SLA age, tier, booking counts, premium preconditions with per-item verified flags, storefront publish state, public rating summaries (own, per axis).
- **Nav in:** P5 role landing.
- **Nav out:** T2 (resume wizard), T5, T6, T7, T8, P2 (own public page).
- **States:** loading (hero + checklist skeletons), no-application (empty state "Anda belum mengajukan diri sebagai mentor" + "Mulai pengajuan"), draft (status "Draf", resume CTA), pending-review (warn banner with SLA age; evidence fields locked with explanation), rejected (danger banner with the templated reason + "Perbaiki pengajuan"), approved (success state, counts populated), premium-in-progress (checklist of outstanding preconditions), fully-certified (brand badge panel with issuance date), partial-data (a count endpoint fails → that tile shows "—" + retry, rest usable), error (page banner + retry).

#### T2 — Application wizard 1 — tier & evidence

- **Purpose:** pick a target tier, then supply exactly the evidence that tier requires.
- **Primary action:** "Lanjut".
- **Components:** stepper (1 of 3, editor variant); tier selector as three `--radius-md` option cards (Basic / Educator Standard / Educator Premium) each listing its requirements before selection; dynamically revealed evidence groups; evidence rows (URL fields with inline format validation, upload controls with filename + remove, institutional email OTP trigger); per-item status chip (Belum diisi / Terisi / Tidak valid); "Daftar item yang kurang" summary above the CTA; autosave indicator; "Simpan draf" secondary.
- **Data:** tier requirement matrix (from config/API), saved evidence, OTP state for institutional email, application status.
- **Nav in:** T1, T4 back.
- **Nav out:** T3, T1 (save & exit).
- **States:** loading (tier cards skeleton), default, tier-selected (requirements revealed with a 150ms fade, no layout jump beyond expected), field-error (invalid URL, SISTER format, unreadable upload — inline, per field, never a single global error), missing-evidence (submit stays enabled but validation lists missing items explicitly: "2 bukti belum lengkap: ID Scopus/ORCID, sertifikat pelatihan"), OTP-pending (inline "Kode dikirim ke email institusi" + input), OTP-verified (success chip), saved (toast + autosave), under-review (read-only with banner "Pengajuan sedang ditinjau. Anda dapat menarik pengajuan."), rejected (danger banner, reason, previously verified items pre-marked so only the flagged ones need attention), withdrawn-then-editing (info banner "Pengajuan ditarik. Perubahan dapat dilanjutkan."), save-error (banner, values preserved).

#### T3 — Application wizard 2 — well-being self-assessment

- **Purpose:** mandatory psychological-readiness and empathy self-assessment, reviewable by admin only.
- **Primary action:** "Simpan & lanjut".
- **Components:** stepper (2 of 3); privacy scope note ("Jawaban ini hanya dibaca tim verifikasi LMNS dan tidak ditampilkan di halaman publik Anda."); 4–6 structured prompts (mentoring philosophy, boundary-setting habits, approach to student burnout) as textareas with counters, plus 2–3 attitude statements on a 4-point agreement scale; helper guidance on length; primary/secondary footer.
- **Data:** stored answers, completion state, timestamp; never any mentee pulse/mood data.
- **Nav in:** T2 "Lanjut", T1 resume.
- **Nav out:** T4, T2 (back).
- **States:** default, prefilled, incomplete (submit blocked with explicit list: "Asesmen belum lengkap. Isi semua bagian untuk melanjutkan."), validation-error (per-field minimum length), saving, save-error, locked-under-review (read-only + banner), previously-completed-upgrade (answers carried over for a Premium upgrade and shown read-only unless re-confirmation is required — no re-entry of academic evidence).

#### T4 — Application wizard 3 — storefront builder + preview

- **Purpose:** build the Superprof-style storefront with a faithful preview, then submit the application.
- **Primary action:** "Kirim pengajuan".
- **Components:** stepper (3 of 3); editor column (research niche, methodological strengths tags, languages, session formats, intro video URL, bio textarea with live counter, packages repeater with add/remove/edit: title, description, duration, price or "Konsultasi gratis"); "Pratinjau" toggle rendering the P2 layout with a "Pratinjau — belum terbit" banner; submit summary ("Yang akan dikirim" list of completed evidence + assessment + packages); primary "Kirim pengajuan"; secondary "Simpan draf".
- **Data:** storefront draft, package list, char limits from config, preview payload.
- **Nav in:** T3, T1, T5 (editor reuse without the wizard chrome).
- **Nav out:** T1 (submitted → pending), P2 preview (in-place, not a navigation).
- **States:** default, adding/removing package (inline, no modal), counter-near-limit (counter turns `--warn-fg` at 90%), over-limit (counter `--danger-fg`, submit blocked with message), package-missing (Educator Standard requires ≥1 package → inline error on the package group), preview-empty (missing fields render as labelled placeholders, never fabricated content), preview-error (banner inside preview only, editor unaffected), submitting (loading, all inputs locked), submit-success (success state → T1 with "Menunggu verifikasi" and SLA), submit-error (banner + retry, no duplicate application), locked-under-review (read-only, "Tarik pengajuan" destructive-with-confirm only).

#### T5 — Storefront studio (post-approval editor)

- **Purpose:** keep the public page accurate after approval without re-entering verified credentials.
- **Primary action:** "Simpan perubahan".
- **Components:** same editor components as T4 without the wizard chrome; published-state header ("Terbit" pill + "Lihat halaman publik" link); verified-credentials block that is **read-only** with a note "Data terverifikasi hanya dapat diubah melalui pengajuan ulang"; preview toggle; unsaved-changes guard on navigation; save bar (sticky on desktop).
- **Data:** published storefront, verified credential summary, package list, availability note.
- **Nav in:** T1, T4 (post-approval), P2 ("Kelola etalase" for own profile).
- **Nav out:** T1, P2, T6.
- **States:** loading, default/saved, dirty ("Perubahan belum disimpan" warn bar + save), saving, save-success (toast + pill unchanged), save-error (banner + retry, edits preserved), validation-error (per-field), preview, published-success, unpublished-account (blocked state: "Etalase dapat diedit setelah pengajuan disetujui."), stale-conflict (info banner "Halaman ini sudah diperbarui di tab lain. Muat ulang untuk melihat versi terbaru." — no silent overwrite).

#### T6 — Premium upgrade, training & assessment

- **Purpose:** one-click upgrade path: training modules, assessment, certificate upload, and a checklist that explains why the badge is or is not issued yet.
- **Primary action:** "Mulai pelatihan" → "Kerjakan asesmen" → "Kirim sertifikat" (progressive).
- **Components:** upgrade hero (`--brand-tint`, purple brand accent) stating exactly what Premium adds **and** what it does not; precondition checklist (S3 verified · overseas experience verified · training passed · certificate verified) with per-item state and links to fix; module list with progress (locked/available/in-progress/completed); assessment card (question count, pass threshold, attempts remaining, last score with retake rule); certificate upload (file name, remove, format/size helper); status pill; "Ajukan peninjauan badge" CTA when all preconditions except admin verification are met.
- **Data:** training progress, assessment result and attempts, certificate state, verified academic flags, badge state + issuance date, audit-log entries visible to the mentor (date + decision).
- **Nav in:** T1 premium panel, T5, A3-issued notification.
- **Nav out:** T1, T6 modules stay in place.
- **States:** loading, not-eligible (Basic not yet approved → empty state with the requirement list and a link to the application), eligible, training-in-progress (progress bar + resume), training-complete, assessment-available, assessment-in-progress, assessment-failed (danger banner with score against threshold + retake if attempts remain + policy text), assessment-passed, certificate-missing (warn + upload), certificate-pending-review, badge-issued (success + brand badge + issuance date + "Tampil di profil Anda sekarang"), badge-revoked (danger banner with reason and re-application path), error (per-section, never blocks reading progress), all-preconditions-met ("Menunggu verifikasi admin" warn state).
- **Notes:** no promise of outcome ("tingkatkan penghasilan" etc.). The copy states only what the system does.

#### T7 — Incoming bookings (mentor)

- **Purpose:** triage booking requests and reach the mediation thread.
- **Primary action:** "Buka ruang mediasi".
- **Components:** filters (Perlu tindakan · Menunggu konfirmasi Anda · Terjadwal · Selesai); request cards (mentee name + jenjang/kampus, package, topic summary from the intake note **excluding stress level**, time requested, progressive status pill, alignment progress, CTA); SLA/response hint if enforced, otherwise absent; empty state; skeletons; error retry.
- **Data:** bookings with alignment progress, mentee academic profile summary, intake topic/bottleneck text (never the stress selection), package, settlement details from the card.
- **Nav in:** T1 preview, notification placeholder.
- **Nav out:** T8, T1.
- **States:** loading, success, empty ("Belum ada permintaan masuk" + explanation that verified listings accrue requests over time), filtered-empty, partial (mentee profile fetch fails → name + topic still render, profile block shows retry), error, unpaid (row visible but locked with "Booking belum dibayar" and no CTA), one-sided (row shows "Menunggu konfirmasi Anda" as an accent CTA), completed-needs-nothing (row read-only).

#### T8 — Mediation room — mentor variant

Same screen contract as M7 (shared component), with these deltas:

- **Primary action:** "Konfirmasi kesepakatan" (mentor side).
- **Extra components:** mentee context strip (name, jenjang, kampus, topic) — **no stress or mood data, ever**; settlement fields prefilled from the mentor's saved settlement preference but always editable before confirming; "Tetapkan jadwal" emphasis on item 2.
- **States:** identical to M7, with the one-sided copy inverted ("Menunggu konfirmasi mentee.") and an extra `mentee-profile-missing` partial state (context strip shows a placeholder + retry, thread still operable).
- **Notes:** mentors never see pulse or mood answers, in this screen or any other (§13.4 of the design system). This is a release blocker.

### 2.4 Admin

#### A1 — Verification queue

- **Purpose:** work the application queue in one place with SLA visibility.
- **Primary action:** "Tinjau" (open A2).
- **Components:** toolbar (search by name/email, filters: tier, status, "Melewati SLA"); summary tiles (Menunggu verifikasi, Melewati SLA, Disetujui 7 hari, Ditolak 7 hari); table (applicant, tier, submitted date, SLA age with warn styling past threshold, missing-evidence count badge, status pill, action); sortable columns (`aria-sort`); load-more; empty state; skeletons; error banner.
- **Data:** applications with tier, dates, SLA age, missing-evidence count, status; no mentee well-being data of any kind.
- **Nav in:** P5 admin landing, A1 reload.
- **Nav out:** A2, A3.
- **States:** loading (5 skeleton rows), success, empty ("Antrean kosong" — nothing pending), filtered-empty (clear filters), partial (SLA calculation unavailable → column shows "—" with an info banner "Perhitungan SLA tidak tersedia sementara."), error (banner + retry, filters preserved), stale-row (opened application changed by another admin → info banner on A2 and refresh of that row), concurrency-blocked (a second admin approve attempt returns a "sudah ditinjau" state, not a duplicate decision).

#### A2 — Application detail, evidence & decision

- **Purpose:** verify each credential against its source and decide with a templated, recorded reason.
- **Primary action:** "Setujui" or "Tolak" (destructive, requires a reason).
- **Components:** header (applicant, tier, submitted, SLA age, status pill); evidence list — one row per required item for the tier, each with type, submitted value (mono for SISTER/Scopus IDs), external "Buka" link, format-validation flag, and reviewer mark (Belum diperiksa / Cocok / Tidak cocok); missing-evidence summary banner; domain validation flag; well-being self-assessment panel (read-only prose, marked "Hanya untuk verifikasi"); premium precondition panel with per-item verified/unverified/blocked states and the disabled badge control with its reason; decision bar (sticky) with "Setujui" and "Tolak"; reject flow requires selecting a templated reason (+ optional note) in a modal; audit trail list (actor, timestamp, action, reason).
- **Data:** all application evidence and flags, self-assessment text, premium preconditions, audit entries, decision state. Never mentee data.
- **Nav in:** A1 row.
- **Nav out:** A1 on decision (with toast + row updated), back to queue.
- **States:** loading (header + evidence row skeletons), success/undecided, missing-evidence (warn banner listing the exact items; approve disabled with reason), invalid-domain (danger flag row), evidence-link-broken (row-level "Tautan tidak dapat dibuka" + retry — this is the partial state that must be visible, not hidden), all-verified (approve enabled), reject-reason-required (modal; submit disabled until a template is chosen), submitting (decision bar loading, both buttons locked), decision-success (success banner on A2 or return to A1 with updated row), conflict (another admin decided → warn banner "Pengajuan ini sudah ditinjau oleh {nama}." with read-only state), error (banner + retry; evidence marks preserved), premium-preconditions-unmet (badge issuance disabled with the missing list), previously-rejected-then-resubmitted (timeline shows the earlier rejection reason + new submission date, and the previously-flagged items are highlighted so the reviewer can re-check them first).

#### A3 — Premium badge management

- **Purpose:** issue, revoke, and audit Premium Well-Being badges.
- **Primary action:** "Terbitkan badge" (when preconditions hold) / "Cabut badge" (with reason).
- **Components:** search + filter (Bersertifikat / Memenuhi syarat / Belum memenuhi); badge table (mentor, tier, S3 verified, overseas verified, training passed, certificate verified, badge state, issued date, action); precondition chips per row; issue/revoke modal with reason select + note; audit-log drawer per mentor.
- **Data:** per-mentor precondition flags, badge state, issuance/revocation log (actor, timestamp, reason).
- **Nav in:** A1, T1 (mentor sees the result, not this screen).
- **Nav out:** A1, A2.
- **States:** loading, success, empty ("Belum ada mentor dengan pengajuan badge"), filtered-empty, partial (one precondition fetch fails → chip "Tidak diketahui" + retry, issue stays disabled with reason), issue-disabled (reason list visible), issuing (loading), issued (success + toast + log entry), revoke-required-reason (modal), revoked (danger state + reason + log), conflict (already issued/revoked by another admin), error (banner + retry).

### 2.5 Shared

#### X1 — Persona switcher (demo)

- **Purpose:** let the demo move between the seeded accounts without signing out and retyping passwords.
- **Primary action:** select an account.
- **Components:** trigger in the top app bar (avatar + current name + role chip), popover/sheet listing seeded accounts grouped by role, each row showing name, email, tier/state one-liner, and the demo purpose ("booking belum dibayar", "kesepakatan satu sisi"); "Keluar" at the bottom.
- **Data:** seeded account list from config; never a password.
- **Nav in:** every authenticated screen.
- **Nav out:** the selected role's landing screen (mentee → M6, mentor → T1, admin → A1).
- **States:** default, open, switching (row spinner, popover stays open briefly then closes), switched (toast "Beralih ke {nama}"), empty (demo data not seeded → banner "Data demo belum dimuat. Jalankan `npm run seed`."), error (banner + retry).
- **Notes:** visible in every environment of the prototype, but the seeded emails are labelled "Akun demo" so nobody mistakes them for real records.

#### X2 — Not found

- **Purpose:** recover from a bad route or an unavailable record without a dead end.
- **Primary action:** "Kembali ke beranda".
- **Components:** empty-state block, 404 code in mono `--muted`, one sentence, primary CTA, secondary "Cari mentor".
- **States:** not-found route, record-not-found (used by P2/M7/A2 when the id is unknown — same layout with record-specific copy), unauthorized (signed in but wrong role → "Halaman ini tidak tersedia untuk peran Anda." + role landing CTA), generic error (→ error copy + retry).

---

## 3. State matrix

Five states per screen: **empty** (no data, and *which* kind of no-data), **loading** (skeleton intent), **success**, **partial** (some data missing or one party/side incomplete — the state most often skipped in builds), **error-recovery** (what fails, what stays usable, how the user gets out).

Mandatory rows are marked **[M]**: unpaid booking, one-sided agreement, missing evidence, rejected-then-resubmitted, zero-result filters. The matrix carries both the per-screen row and the dedicated mandatory row, because a build can pass one and fail the other.

| Screen | Empty | Loading | Success | Partial | Error recovery |
|---|---|---|---|---|---|
| P1 Discovery | `Tidak ada mentor yang cocok` + active filter chips + `Hapus semua filter` (primary, secondary style); count reads `0 mentor` | 6 mentor-card skeletons (avatar 56, 2 title bars, badge pills, 2 meta bars) + chip skeletons; header and search stay real | Card grid with count `12 mentor ditemukan` announced politely; verified badges and both rating axes rendered | Some cards lack reviews or a rate: `Belum ada ulasan` / `Konsultasi gratis` instead of a fake 0; a failed facet count shows the chip without a count | Danger banner `Gagal memuat daftar mentor. Periksa koneksi lalu coba lagi.` + `Coba lagi`; search text and filters preserved |
| **[M] P1 zero-result filters** | Filters that return nothing: count `0 mentor`, empty state names the active set, chips removable individually, one-click `Hapus semua filter` restores results; alternative suggestion `Coba longgarkan filter Tier atau Tujuan studi.` | Reloading with a filter change: grid becomes skeletons, chips stay interactive, count shows a 12px spinner | Clearing filters returns the full grid and announces `12 mentor ditemukan` | Only part of the filter set matches: results render plus info banner `Filter Tujuan studi belum punya hasil. Lihat hasil lain di bawah.` and a chip to drop that facet | Filter request fails: keep previous results visible (dimmed 60%) and show `Filter tidak dapat diterapkan. Hasil sebelumnya tetap ditampilkan.` + `Coba lagi` |
| P2 Mentor page | No reviews: per axis `Belum ada ulasan` (never 0 stars); no packages: section shows `Belum ada paket`; both leave the CTA intact | Header + 2 prose skeletons + review skeletons; booking panel shows price and fee placeholders until loaded | Full page: badges, verified links, packages, two independent axis summaries, review list | One axis has reviews, the other does not: render each axis separately, never an average; broken evidence link shows plain text instead of a dead link | Page-level banner `Gagal memuat sebagian data mentor.` + `Coba lagi`; loaded sections stay; 404 variant for an unknown slug |
| P3 Register | n/a (form) | Email domain check: spinner inside the field, `Memeriksa domain…` | Submit → button `Memproses…` → P4 with masked email | Password strength met but email unverified by the domain lookup: allow submit, verify later at OTP | Field errors under the exact field + summary `1 isian perlu diperbaiki.`; duplicate account banner `Email ini sudah terdaftar. Masuk atau atur ulang kata sandi.`; server error keeps all values |
| P4 Verify OTP | n/a (single field) | `Memverifikasi…` on the button, input read-only | Success banner `Email Anda terverifikasi.` → M1 after 1.5s, plus a manual `Lanjut` | Code accepted but profile still incomplete: land on M1 with a note `Lengkapi profil akademik untuk mulai mengajukan sesi.` | `Kode kedaluwarsa. Minta kode baru.` / `Kode tidak sesuai. Periksa kembali 6 digit terakhir.` + `Kirim ulang` ghost with 60s countdown; typed code preserved |
| P5 Sign in | Demo list unavailable → banner `Data demo belum dimuat. Jalankan npm run seed.` | `Masuk…` with fields locked | Redirect to the role landing (mentee M6, mentor T1, admin A1) | Signed in but profile incomplete → redirect to M1 with info banner, not an error | `Email atau kata sandi tidak sesuai.` (no enumeration) + retry; session expired → `Sesi Anda berakhir. Silakan masuk kembali.` with return path kept |
| M1 Academic profile | First visit: empty fields, goals disabled with helper `Pilih jenjang terlebih dahulu.` | Draft restore: brief `Memulihkan draf…` line, no full-screen spinner | Saved → `Lanjut ke pulse`, toast `Profil akademik tersimpan.` | Partial profile (level + campus only) may be saved; a summary on M6 flags `Profil belum lengkap` with a link back | Per-field errors + summary; save failure banner `Perubahan belum tersimpan. Coba lagi.` with values preserved and the draft intact |
| M2 Pulse | Questions unanswered: all options equal weight, none preselected | `Menyimpan…` on the primary button | Thank-you line `Terima kasih. Jawaban Anda tersimpan dan hanya dapat Anda lihat.` → M6 | Some answers given, some skipped: save allowed; nothing reported back as a score | `Jawaban belum tersimpan. Coba lagi.` with selections preserved; skip always available and never blocked by an error |
| M3 Booking request | Empty form with mentor summary visible; package selector unselected for Premium | Submit `Membuat permintaan…`; summary stays readable | → M4 with booking reference; no thread created yet | Intake saved but no package chosen on a Premium mentor: inline error on the package group only, topic preserved | Banner `Permintaan belum terkirim. Coba lagi.` — retry is idempotent and must not create a second booking; unverified account sees a blocking banner with a link to P4 |
| **[M] M4 unpaid booking** | Booking exists but `UNPAID`: order summary shows `Menunggu pembayaran`, the mediation thread does not exist, and any deep link to M7 renders the locked gate | Summary skeletons while the fee and perk flags load; the CTA is disabled until loaded | Payment confirmed → M5 success → M7 unlocked; booking pill becomes `Menunggu kesepakatan` | Fee loaded, perk comparison failed: payment can proceed, comparison modal shows `Perbandingan tier tidak dapat dimuat.` + retry | `Pembayaran tidak berhasil. Booking Anda belum aktif dan biaya belum terpotong.` + `Coba lagi`; booking remains `UNPAID`; consent state preserved |
| M5 Payment status | n/a | `Memeriksa pembayaran…` with up to 3 polls, `aria-live` polite | `Pembayaran berhasil.` + reference + `Buka ruang mediasi` | Pending longer than expected: warn banner `Pembayaran belum terkonfirmasi. Booking belum aktif.` + reference + `Periksa lagi` | `Kami tidak dapat memeriksa status pembayaran.` + `Coba lagi`; failed state names the reason and keeps retry, thread stays closed |
| M6 My bookings | `Belum ada booking` + `Cari mentor`; filtered-empty `Tidak ada booking di filter ini` + clear | 4 booking-card skeletons matching the real card (mentor row, pill, progress, button) | List with context CTA per row and a review prompt banner where eligible | One mentor record fails: row renders with `Gagal memuat data mentor.` + retry, the rest of the list works | `Gagal memuat booking.` + `Coba lagi`; filter state preserved |
| M7 Mediation room | No messages: `Belum ada pesan. Sapa mentor dan isi butir kesepakatan.`; alignment card fully editable | Thread skeleton bubbles + card skeleton; composer disabled while loading | All three items confirmed by both → success banner `Kesepakatan dikonfirmasi kedua pihak. Sesi terjadwal.` and status `Terjadwal` | Two of three items agreed: progress `2/3 butir disepakati`, CTA disabled with `Lengkapi semua butir untuk menjadwalkan sesi.`; message send failure keeps the text in the composer | `Pesan gagal terkirim.` inline next to the composer + retry without duplicating; thread load failure shows a banner while the alignment card stays operable if loaded |
| **[M] M7 one-sided agreement** | One party confirmed: warn banner `Anda sudah mengonfirmasi. Menunggu konfirmasi Sari Prameswari.` (mentor side: `Menunggu konfirmasi mentee.`), CTA becomes `Menunggu konfirmasi` (disabled, reason visible), pill `Menunggu konfirmasi pihak lain` | Confirming: CTA `Mengonfirmasi…` with the item states locked | Second confirmation arrives → success banner, pill `Terjadwal`, card becomes read-only, and a system message records who confirmed when | Edited after one-sided confirm: `Anda mengubah butir ini. Kedua pihak perlu mengonfirmasi ulang sebelum sesi kembali terjadwal.` — both flags reset, previously confirmed items marked `Perlu konfirmasi ulang` | Confirm request fails: `Konfirmasi belum tersimpan.` + retry, the item stays in its prior state (never a silent optimistic confirm) |
| M8 Review | No rating selected: both axes empty, anchors visible, submit enabled and validated on press | Both rating groups as skeletons; summary strip real | `Terima kasih. Penilaian Anda sudah terkirim.` → mood step → completion; both axes appear separately on P2 | One axis rated, the other not: submit blocked with `Pilih nilai untuk kedua aspek sebelum mengirim.` and only the unrated axis marked | `Penilaian belum terkirim.` + `Coba lagi`; selections preserved; already-reviewed state is read-only with `Anda sudah menilai sesi ini.` |
| M8 Mood check | Step shown after review with no option preselected; `Lewati` equally available | `Menyimpan…` on selection, single tap, no second confirm | `Terima kasih. Jawaban Anda tersimpan dan hanya dapat Anda lihat.` | Skipped: completion continues with no mood record and no re-prompt in the same session | `Jawaban belum tersimpan.` + retry; skip still works and always ends the flow |
| T1 Mentor dashboard | No application: `Anda belum mengajukan diri sebagai mentor` + `Mulai pengajuan` | Hero + checklist + count-tile skeletons | Counts, status pill, next action, premium panel, storefront card all current | One count tile fails: shows `—` with a retry affordance, rest of the dashboard usable | Page banner `Sebagian data dasbor tidak dapat dimuat.` + `Coba lagi`; navigation still works |
| T2 Wizard 1 evidence | New application: tier cards unselected, no evidence groups shown | Tier cards + evidence rows skeletons | All required items valid → `Lanjut` advances; autosave toast | Some items filled, some missing: saved, submit lists them explicitly | Per-field errors (`Format SISTER ID belum sesuai.`); save failure banner with values preserved; under-review is read-only with the withdraw path |
| **[M] T2 missing evidence** | Submit attempted with gaps: summary `2 bukti belum lengkap: ID Scopus/ORCID, sertifikat pelatihan.` — items named, each linking to its field, submit stays enabled and validates on press | Missing-item check while an upload processes: row spinner + `Memeriksa berkas…` | All items present and valid → `Kirim pengajuan` succeeds → `Menunggu verifikasi` + SLA | Evidence supplied but a format flag is unreadable: item kept, chip `Tidak valid` with a field-level reason, cleared once re-uploaded | `Pengajuan belum terkirim.` + retry, draft intact; a failed OTP for the institutional email resets only that item |
| T3 Self-assessment | Blank prompts with guidance; submit enabled, validated on press | `Menyimpan…` | `Simpan & lanjut` → T4, draft state updated | Partly answered: saved, but `Lanjut` blocked by an explicit list of unfinished sections | `Jawaban belum tersimpan.` + retry; text preserved; under-review locks the fields with an explanation |
| T4 Storefront builder | No packages yet for Educator Standard: inline `Tambahkan minimal satu paket untuk melanjutkan.`; other fields with placeholders | Preview skeleton while the P2 layout renders | Preview faithful to P2 with `Pratinjau — belum terbit`; submit succeeds → pending state | Character counter at 90% (`--warn-fg`); over-limit blocks submit with `Deskripsi melebihi 600 karakter.` while typing continues; missing optional fields show labelled placeholders in the preview | `Pengajuan belum terkirim.` + retry without creating a duplicate; preview failure shows a banner inside the preview only |
| **[M] T2/A2 rejected → resubmitted** | Applicant view: danger banner `Pengajuan Anda belum dapat disetujui.` + `Alasan: Bukti pengalaman studi atau kerja di luar negeri belum dilampirkan.` + `Perbaiki pengajuan`; only the flagged items are editable-required | Resubmitting: `Mengirim ulang…`, previously verified rows read-only | After resubmit: `Pengajuan Anda sudah dikirim ulang pada 18 Nov 2026 dan sedang ditinjau. Perkiraan keputusan 2–3 hari kerja.`, pill `Menunggu verifikasi` | Reviewer view of the same application: timeline shows the earlier rejection with its reason and the new submission date; previously flagged items carry a `Perlu diperiksa ulang` mark while the rest stay `Cocok` | Resubmit failure: `Pengajuan gagal dikirim ulang.` + retry; nothing is lost, and the application remains `REJECTED` until the resubmit actually lands |
| T5 Studio editor | Storefront not yet approved: blocked empty state `Etalase dapat diedit setelah pengajuan disetujui.` | Form + preview skeletons | `Perubahan tersimpan.` toast, published pill unchanged | Unsaved-changes bar `Perubahan belum disimpan.`; stale tab → `Halaman ini sudah diperbarui di tab lain. Muat ulang untuk melihat versi terbaru.` (no silent overwrite) | `Perubahan gagal disimpan.` + retry with edits preserved; navigation guard asks before discarding |
| T6 Premium upgrade | Not eligible: requirement list + `Ajukan sebagai mentor terlebih dahulu` link | Module list + checklist skeletons | All preconditions met → `Menunggu verifikasi admin`; on issuance, brand badge + `Sertifikat diterbitkan 18 Nov 2026` | Training passed but certificate pending: checklist shows each item separately, CTA is `Kirim sertifikat` | `Hasil asesmen belum tersimpan.` + retry; module progress survives; revoked badge shows the reason and the re-application path |
| T7 Incoming bookings | `Belum ada permintaan masuk` + one line explaining verified listings accrue requests over time | 4 request-card skeletons | List with alignment progress and CTA; unpaid rows locked with `Booking belum dibayar` | Mentee profile fetch fails: name + topic render, the profile block shows retry; intake topic is shown, stress selection never is | `Gagal memuat permintaan.` + retry; filters kept |
| T8 Mentor mediation | Same as M7 with inverted copy: `Menunggu konfirmasi mentee.` | Same as M7 | Same as M7 | Mentee context strip unavailable: placeholder + retry, thread still operable | Same as M7 |
| A1 Verification queue | `Antrean kosong` (all applications decided) + helper `Tidak ada pengajuan yang menunggu.`; filtered-empty offers clear | 5 skeleton rows, sticky header real | Queue with SLA ages, missing-evidence counts, status pills | SLA unavailable: column `—` + info banner `Perhitungan SLA tidak tersedia sementara.` | `Gagal memuat antrean.` + retry; filters preserved; a row already decided by another admin refreshes with an info chip instead of duplicating a decision |
| A2 Application detail | n/a (record view); record missing → X2 `Pengajuan tidak ditemukan` | Header + evidence-row skeletons; decision bar disabled with `Memuat data pengajuan…` | Approve/reject succeed → audit entry appended + toast + return to A1 with the row updated | Broken evidence link `Tautan tidak dapat dibuka.` + retry, other evidence still markable; missing items listed in a warn banner | `Keputusan belum tersimpan.` + retry with marks preserved; conflict → `Pengajuan ini sudah ditinjau oleh Dewi Kartika.` and a read-only view |
| **[M] A2 missing evidence** | Self-assessment complete but two credentials absent: warn banner `2 bukti belum lengkap: ID Scopus/ORCID, sertifikat pelatihan.`; `Setujui` disabled with the reason inline; badge issuance disabled with the same list | Missing-evidence flags computing while the page loads: banner area shows a text skeleton | All items verified → `Setujui` enabled; decision recorded with actor, timestamp, reason | Evidence present but one link 404s: that row is `Tidak cocok` with a note, the reviewer can still decide and the reason templates include the missing-credential option | Decision POST fails: `Keputusan belum tersimpan.`; no partial decision state; the reviewer may retry or leave with marks intact |
| A3 Badge management | `Belum ada mentor dengan pengajuan badge` | Table skeletons | Issue/revoke succeeds with a log entry visible | One precondition fetch fails: chip `Tidak diketahui`, issue disabled with `Syarat belum dapat diverifikasi.` | `Badge belum dapat diterbitkan.` + retry; conflict `Badge sudah diterbitkan oleh ...` refreshes the row |
| X1 Persona switcher | Demo data not seeded: `Data demo belum dimuat. Jalankan npm run seed.` | Row spinner during the switch | Toast `Beralih ke Rani Kusuma.` and the correct role landing | Selected account has incomplete state (e.g. unverified) → lands on the screen that explains it, not an error | `Gagal beralih akun.` + retry; current session unchanged |
| X2 Not found | Route 404, record 404, wrong-role 403 each with their own sentence and a role-appropriate CTA | n/a | n/a | n/a | Generic error variant with `Coba lagi` |

**Matrix coverage check:** every list surface (P1, M6, T7, A1, A3) has all five states; every form surface (P3, M1, M3, M4, M7, M8, T2, T3, T4, T5, T6) has empty/incomplete, loading, success, partial, and error-recovery. All five mandatory rows are present as their own rows.

---

## 4. Indonesian microcopy — high-stakes strings

Copy is data: it lives in one module so it can be reviewed and audit-checked for unenforceable claims. Placeholders in `{}` come from config or API. Nothing here promises an outcome, a refund policy, or a clinical service.

### 4.1 Platform-fee disclosure (M4)

| ID | String (Bahasa Indonesia) | Where / constraint |
|---|---|---|
| fee.title | `Rincian biaya` | Order summary heading |
| fee.row | `Biaya platform LMNS` — `Rp {fee}` | `{fee}` from `PLATFORM_FEE_IDR`; never a literal |
| fee.once | `Dibayar sekali untuk setiap permintaan sesi.` | Under the fee row |
| fee.covers | `Biaya platform mencakup verifikasi kredensial mentor, ruang mediasi sebelum sesi, dan pencatatan kesepakatan yang dapat diakses kedua pihak.` | Disclosure block |
| fee.notSessionFee | `Biaya platform bukan pembayaran sesi. Honor sesi disepakati langsung dengan mentor di ruang mediasi dan dibayarkan langsung kepada mentor, di luar LMNS.` | Mandatory; the single most important sentence on the screen |
| fee.sessionBasis | `Honor sesi: dibayar langsung ke mentor` / `Honor sesi: gratis (Rp 0)` | Derived from tier and package; Educator free session uses the second form |
| fee.noPromise | `Biaya platform tidak menjamin hasil akademik, tidak menahan honor sesi, dan tidak memberi akses ke layanan kesehatan mental.` | Explicit "what it does not buy" (PRD §10) |
| fee.demo | `Mode demo: pembayaran disimulasikan. Tidak ada uang yang benar-benar dipindahkan.` | Always visible in the prototype; never removed for screenshots |
| fee.noCardData | `Jangan masukkan data kartu atau rekening yang sebenarnya.` | Next to the provider selector |
| fee.consent | `Saya sudah membaca rincian biaya dan memahami bahwa honor sesi dibayar langsung kepada mentor.` | Consent checkbox label; payment CTA disabled until checked |
| fee.cta | `Bayar biaya platform` | Primary CTA |
| fee.notRefund | *Deliberately absent.* Refunds and escrow are out of scope (D6); no refund promise may be invented here. | — |

### 4.2 Alignment items (M7 / T8)

| ID | String (Bahasa Indonesia) | Where / constraint |
|---|---|---|
| align.title | `Kartu kesepakatan` | Card heading |
| align.subtitle | `Sesi hanya dijadwalkan setelah kedua pihak mengonfirmasi ketiga butir.` | Under the heading; states the hard gate |
| align.item1.title | `Ruang lingkup & hasil akademik` | Item 1 |
| align.item1.field1 | `Yang akan dibahas` | Text field |
| align.item1.field2 | `Yang Anda bawa pulang` | Text field (deliverable) |
| align.item1.help | `Tuliskan secara spesifik, misalnya: revisi bab 3 dan rencana uji validitas.` | Helper |
| align.item2.title | `Jadwal & tautan sesi` | Item 2 |
| align.item2.field1 | `Tanggal & waktu (WIB)` | Future datetime only |
| align.item2.field2 | `Tautan video sesi` | Must be a valid URL; validated inline |
| align.item2.help | `Gunakan waktu WIB. Tautan harus dapat dibuka kedua pihak.` | Helper |
| align.item3.title | `Honor sesi & cara pembayaran langsung` | Item 3 |
| align.item3.field1 | `Nominal yang disepakati` | `Rp` prefix, ≥ 0 |
| align.item3.field2 | `Metode pembayaran langsung` | Transfer bank / e-wallet |
| align.item3.field3 | `Nama penerima` | Must match the mentor's stated name |
| align.item3.help | `Pembayaran dilakukan langsung kepada mentor, di luar LMNS. Untuk sesi Educator gratis, nominal tertulis Rp 0.` | Helper; the direct-settlement fact |
| align.status.waitingYou | `Menunggu Anda` | Per-item status |
| align.status.waitingThem | `Menunggu {nama}` | Per-item status |
| align.status.agreed | `Disepakati` | Per-item status |
| align.status.reconfirm | `Perlu konfirmasi ulang` | Set for both parties after an edit |
| align.cta.confirm | `Konfirmasi kesepakatan` | Primary CTA |
| align.cta.blocked | `Lengkapi semua butir untuk menjadwalkan sesi.` | CTA disabled reason |
| align.cta.waiting | `Menunggu konfirmasi` | After own confirmation |
| align.oneSided | `Anda sudah mengonfirmasi. Menunggu konfirmasi {nama}. Sesi belum terjadwal sampai kedua pihak mengonfirmasi seluruh butir.` | Warn banner, mentee side |
| align.oneSidedMentor | `Anda sudah mengonfirmasi. Menunggu konfirmasi mentee. Sesi belum terjadwal sampai kedua pihak mengonfirmasi seluruh butir.` | Warn banner, mentor side |
| align.confirmed | `Kesepakatan dikonfirmasi kedua pihak. Sesi terjadwal.` | Success banner |
| align.edited | `Anda mengubah butir ini. Kedua pihak perlu mengonfirmasi ulang sebelum sesi kembali terjadwal.` | Warn banner after edit |
| align.lockedUnpaid | `Ruang mediasi terbuka setelah biaya platform dibayar.` | Gate empty state; CTA → M4 |
| align.emptyThread | `Belum ada pesan. Sapa mentor dan isi butir kesepakatan.` | Thread empty state |
| align.stored | `Kesepakatan tersimpan dan dapat dilihat kedua pihak.` | Footnote of the confirmed card |

### 4.3 Verification rejection reasons (A2 → applicant)

Templates are a closed list (one-click select, plus an optional free-text note). Rejection requires a selection; nothing is sent without one.

| ID | String (Bahasa Indonesia) | Trigger |
|---|---|---|
| reject.sister | `Bukti SISTER ID tidak dapat diverifikasi.` | SISTER ID/format/record mismatch |
| reject.scopus | `ID Scopus/ORCID tidak ditemukan atau tidak cocok dengan nama pengaju.` | Record not found |
| reject.overseas | `Bukti pengalaman studi atau kerja di luar negeri belum dilampirkan.` | Premium/overseas precondition |
| reject.certificate | `Sertifikat pelatihan mental health coaching tidak terbaca.` | Unreadable upload |
| reject.domain | `Email institusi tidak sesuai dengan domain kampus yang terdaftar.` | Domain allowlist mismatch |
| reject.degree | `Dokumen jenjang (S2/S3) tidak sesuai dengan tier yang diajukan.` | Level mismatch |
| reject.links | `Tautan Google Scholar atau LinkedIn tidak dapat dibuka.` | Dead/invalid link |
| reject.assessment | `Asesmen kesejahteraan belum lengkap.` | Incomplete self-assessment |
| reject.bannerTitle | `Pengajuan Anda belum dapat disetujui.` | Applicant banner title |
| reject.bannerBody | `Alasan: {reason}. Perbaiki butir yang ditandai lalu kirim ulang. Anda tidak perlu mengisi ulang data yang sudah terverifikasi.` | Applicant banner body |
| reject.cta | `Perbaiki pengajuan` | Primary action for the applicant |
| evidence.missing | `{n} bukti belum lengkap: {items}.` | Applicant wizard + reviewer detail; items named, never "beberapa" |
| evidence.unreadable | `Berkas tidak dapat dibaca. Unggah ulang dalam format PDF, JPG, atau PNG.` | Upload field error |
| review.pendingTitle | `Pengajuan sedang ditinjau` | Status banner |
| review.pendingBody | `Perkiraan keputusan 2–3 hari kerja sejak pengajuan dikirim.` | SLA text; only rendered if the SLA is actually computed |
| resubmitted.banner | `Pengajuan Anda sudah dikirim ulang pada {tanggal} dan sedang ditinjau. Perkiraan keputusan 2–3 hari kerja.` | After resubmit |
| resubmitted.reviewerNote | `Perlu diperiksa ulang` | Mark on previously flagged items in the reviewer view |

### 4.4 Review axes (M8 → P2)

| ID | String (Bahasa Indonesia) | Where / constraint |
|---|---|---|
| review.title | `Nilai sesi Anda` | Screen title |
| review.axis1 | `Bimbingan Akademik & Riset` | Axis 1 label; fixed, never shortened in the form |
| review.axis1.help | `Seberapa jelas arahan untuk topik, metode, dan langkah riset Anda?` | Axis 1 helper |
| review.axis2 | `Keamanan Psikologis & Dukungan Kesejahteraan` | Axis 2 label; fixed |
| review.axis2.help | `Seberapa aman dan didengar Anda merasa selama sesi?` | Axis 2 helper |
| review.anchor1 | `Sangat kurang` | Rating anchor 1 |
| review.anchor2 | `Kurang` | Anchor 2 |
| review.anchor3 | `Cukup` | Anchor 3 |
| review.anchor4 | `Baik` | Anchor 4 |
| review.anchor5 | `Sangat baik` | Anchor 5 |
| review.separate | `Dua aspek ini dinilai terpisah dan tidak digabungkan menjadi satu skor.` | Mandatory note above the axes |
| review.required | `Pilih nilai untuk kedua aspek sebelum mengirim.` | Blocking validation |
| review.axisRequired | `Pilih nilai untuk aspek ini.` | Per-axis error |
| review.commentLabel | `Ceritakan pengalaman Anda (opsional)` | Comment field |
| review.commentHelp | `Hindari menuliskan nomor telepon, email, atau alamat.` | PII hint; only add an "auto-filtered" claim if the API actually filters |
| review.cta | `Kirim penilaian` | Primary CTA |
| review.thanks | `Terima kasih. Penilaian Anda sudah terkirim.` | Success state |
| review.already | `Anda sudah menilai sesi ini.` | Duplicate guard state |
| review.notYet | `Penilaian tersedia satu jam setelah sesi selesai.` | Not-eligible state |
| review.wrongBooking | `Penilaian hanya untuk sesi yang sudah selesai.` | Blocked state |
| review.cardAcademic | `Akademik` / `Kesejahteraan` | Short labels on cards; `aria-label` carries the full axis name |
| review.none | `Belum ada ulasan` | Zero-review state; never 0 stars |

### 4.5 Mood check (M8, after review)

| ID | String (Bahasa Indonesia) | Where / constraint |
|---|---|---|
| mood.question | `Bagaimana tingkat beban akademik Anda setelah sesi ini?` | Single question; no scoring |
| mood.o1 | `Jauh lebih ringan` | Option; equal visual weight |
| mood.o2 | `Sedikit lebih ringan` | Option |
| mood.o3 | `Tetap sama` | Option |
| mood.o4 | `Sedikit lebih berat` | Option |
| mood.o5 | `Jauh lebih berat` | Option |
| mood.optional | `Jawaban ini opsional.` | Near the options |
| mood.skip | `Lewati` | Ghost action, equal prominence |
| mood.privacy | `Jawaban ini bersifat pribadi. Mentor dan admin tidak dapat melihatnya.` | Mandatory privacy line |
| mood.done | `Terima kasih. Jawaban Anda tersimpan dan hanya dapat Anda lihat.` | Confirmation; the only feedback ever shown |
| mood.error | `Jawaban belum tersimpan. Coba lagi.` | Error recovery, skip still available |
| mood.notClinical | `LMNS bukan layanan kesehatan mental dan tidak menangani kondisi darurat.` | Footer of every well-being capture surface |

**Hard rules for this group:** no score, band, percentage, emoji-face judgement, streak, or "improving/worsening" label is ever derived and displayed. Options carry no colour coding, no warning icon, and no preselection. The mood surface has no badge dot, no countdown, and no re-prompt in the same session after skipping.

### 4.6 Additional high-risk strings

Used constantly, so named here rather than left to the implementer.

| ID | String (Bahasa Indonesia) | Where |
|---|---|---|
| privacy.pulse | `Hanya Anda yang dapat melihat jawaban ini. Mentor dan admin tidak dapat melihatnya.` | M2 header |
| privacy.pulseSkipNote | `Anda melewati pulse. Rekomendasi memakai tujuan akademik Anda.` | M2 → M6 banner |
| onboarding.goalsBlocked | `Pilih jenjang terlebih dahulu.` | M1 goal group helper |
| auth.domainBlocked | `Gunakan email resmi kampus (mis. nama@ui.ac.id). Domain ini belum terdaftar.` | P3 email field error |
| auth.duplicate | `Email ini sudah terdaftar. Masuk atau atur ulang kata sandi.` | P3 banner |
| auth.otpExpired | `Kode kedaluwarsa. Minta kode baru.` | P4 |
| auth.otpWrong | `Kode tidak sesuai. Periksa kembali 6 digit terakhir.` | P4 |
| auth.demoOtp | `Mode demo: kode verifikasi adalah 123456.` | P4, only when the API returns the demo code |
| empty.zeroResults | `Tidak ada mentor yang cocok` | P1 |
| empty.zeroResultsBody | `Coba longgarkan filter Tier atau Tujuan studi.` | P1 |
| empty.clearFilters | `Hapus semua filter` | P1 |
| empty.noBookings | `Belum ada booking` | M6 |
| empty.findMentor | `Cari mentor` | M6, P1 |
| empty.noRequests | `Belum ada permintaan masuk` | T7 |
| empty.queueClear | `Antrean kosong` | A1 |
| empty.queueClearBody | `Tidak ada pengajuan yang menunggu.` | A1 |
| empty.storeUnpublished | `Etalase belum terbit` | T1/T5/P2 |
| gate.medUnpaid | `Ruang mediasi terbuka setelah biaya platform dibayar.` | M7 |
| gate.unverified | `Verifikasi email Anda untuk mengajukan sesi.` | M3 |
| err.genericTitle | `Tidak dapat memuat data` | Shared error banner |
| err.genericBody | `Periksa koneksi lalu coba lagi.` | Shared error banner |
| err.retry | `Coba lagi` | Shared retry action |
| err.saved | `Tersimpan` | Autosave indicator |
| err.unsaved | `Perubahan belum disimpan.` | T5 save bar |
| notfound.title | `Halaman tidak ditemukan` | X2 |
| notfound.record | `Data yang Anda cari tidak ditemukan.` | X2 record variant |
| notfound.role | `Halaman ini tidak tersedia untuk peran Anda.` | X2 403 variant |
| nav.home | `Kembali ke beranda` | X2 |
