/**
 * Indonesian user-facing copy. High-stakes strings are the exact wording from
 * docs/screens.md §4; product-variable values are interpolated by the caller
 * from /api/config, never concatenated literals.
 */

export const copy = {
  appName: 'LMNS',
  tagline: 'Mentoring akademik terverifikasi, dengan keseimbangan dan kesejahteraan di depan.',

  // Shared actions
  retry: 'Coba lagi',
  loading: 'Memuat…',
  save: 'Simpan',
  saveDraft: 'Simpan draf',
  back: 'Kembali',
  next: 'Lanjut',
  cancel: 'Batal',
  close: 'Tutup',
  skip: 'Lewati',
  home: 'Kembali ke beranda',
  findMentor: 'Cari mentor',
  demoNotice: 'Mode demo: pembayaran disimulasikan. Tidak ada uang yang benar-benar dipindahkan.',
  notClinical: 'LMNS bukan layanan kesehatan mental dan tidak menangani kondisi darurat.',

  // Errors
  errTitle: 'Tidak dapat memuat data',
  errBody: 'Periksa koneksi lalu coba lagi.',
  saved: 'Tersimpan',
  unsaved: 'Perubahan belum disimpan.',

  // Auth
  authDomainBlocked: 'Gunakan email resmi kampus (mis. nama@ui.ac.id). Domain ini belum terdaftar.',
  authDuplicate: 'Email ini sudah terdaftar. Masuk dengan email tersebut.',
  authOtpExpired: 'Kode kedaluwarsa. Minta kode baru.',
  authOtpWrong: 'Kode tidak sesuai. Periksa kembali 6 digit terakhir.',
  authInvalidCredentials: 'Email tidak terdaftar atau belum diverifikasi.',
  otpExpiry: 'Kode berlaku 10 menit. Minta kode baru bila sudah kedaluwarsa.',
  gateUnverified: 'Verifikasi email Anda untuk mengajukan sesi.',
  demoAccountsLabel: 'Akun demo',
  demoDataMissing: 'Data demo belum dimuat. Jalankan `npm run seed`.',

  // Onboarding / pulse
  privacyPulse:
    'Hanya Anda yang dapat melihat jawaban ini. Mentor dan admin tidak dapat melihatnya.',
  goalsBlocked: 'Pilih jenjang terlebih dahulu.',
  pulseSaved: 'Terima kasih. Jawaban Anda tersimpan dan hanya dapat Anda lihat.',
  pulseSkippedNote: 'Anda melewati pulse. Rekomendasi memakai tujuan akademik Anda.',
  pulseHistory: 'Jawaban sebelumnya tersimpan. Jawaban baru tidak menghapus riwayat.',
  goals: [
    { value: 'Thesis Anxiety', label: 'Kecemasan skripsi' },
    { value: 'Overseas Scholarship Prep', label: 'Persiapan beasiswa luar negeri' },
    { value: 'Research Methodology', label: 'Metodologi penelitian' },
    { value: 'Burnout Prevention', label: 'Pencegahan burnout' },
    { value: 'Publication Support', label: 'Bantuan publikasi' },
    { value: 'Career in Academia', label: 'Karier di akademik' },
  ],
  goalRequired: 'Pilih minimal satu tujuan bimbingan.',

  // Discovery
  emptyZeroResults: 'Tidak ada mentor yang cocok',
  emptyZeroResultsBody: 'Coba longgarkan filter Tier atau Tujuan studi.',
  clearFilters: 'Hapus semua filter',

  // Booking / fee disclosure
  feeTitle: 'Rincian biaya',
  feeRow: 'Biaya platform LMNS',
  feeOnce: 'Dibayar sekali untuk setiap permintaan sesi.',
  feeCovers:
    'Biaya platform mencakup verifikasi kredensial mentor, ruang mediasi sebelum sesi, dan pencatatan kesepakatan yang dapat diakses kedua pihak.',
  feeNotSessionFee:
    'Biaya platform bukan pembayaran sesi. Honor sesi disepakati langsung dengan mentor di ruang mediasi dan dibayarkan langsung kepada mentor, di luar LMNS.',
  feeNoPromise:
    'Biaya platform tidak menjamin hasil akademik, tidak menahan honor sesi, dan tidak memberi akses ke layanan kesehatan mental.',
  feeNoCardData: 'Jangan masukkan data kartu atau rekening yang sebenarnya.',
  feeConsent:
    'Saya sudah membaca rincian biaya dan memahami bahwa honor sesi dibayar langsung kepada mentor.',
  feeCta: 'Bayar biaya platform',
  feeConsentRequired: 'Centang pernyataan biaya untuk melanjutkan.',

  // Alignment
  alignTitle: 'Kartu kesepakatan',
  alignSubtitle: 'Sesi hanya dijadwalkan setelah kedua pihak mengonfirmasi ketiga butir.',
  alignConfirm: 'Konfirmasi kesepakatan',
  alignBlocked: 'Lengkapi semua butir untuk menjadwalkan sesi.',
  alignWaiting: 'Menunggu konfirmasi',
  alignWaitingYou: 'Menunggu Anda',
  alignWaitingThem: 'Menunggu {nama}',
  alignAgreed: 'Disepakati',
  alignReconfirm: 'Perlu konfirmasi ulang',
  alignOneSided:
    'Anda sudah mengonfirmasi. Menunggu konfirmasi {nama}. Sesi belum terjadwal sampai kedua pihak mengonfirmasi seluruh butir.',
  alignOneSidedMentor:
    'Anda sudah mengonfirmasi. Menunggu konfirmasi mentee. Sesi belum terjadwal sampai kedua pihak mengonfirmasi seluruh butir.',
  alignConfirmed: 'Kesepakatan dikonfirmasi kedua pihak. Sesi terjadwal.',
  alignEdited:
    'Anda mengubah butir ini. Kedua pihak perlu mengonfirmasi ulang sebelum sesi kembali terjadwal.',
  alignLockedUnpaid: 'Ruang mediasi terbuka setelah biaya platform dibayar.',
  alignEmptyThread: 'Belum ada pesan. Sapa mentor dan isi butir kesepakatan.',
  alignEmptyThreadMentor: 'Belum ada pesan. Sapa mentee dan isi butir kesepakatan.',
  alignStored: 'Kesepakatan tersimpan dan dapat dilihat kedua pihak.',
  alignConfirmError: 'Konfirmasi belum tersimpan.',
  alignMessageFailed: 'Pesan gagal terkirim.',

  // Review
  reviewTitle: 'Nilai sesi Anda',
  reviewAxis1: 'Bimbingan Akademik & Riset',
  reviewAxis1Help: 'Seberapa jelas arahan untuk topik, metode, dan langkah riset Anda?',
  reviewAxis2: 'Keamanan Psikologis & Dukungan Kesejahteraan',
  reviewAxis2Help: 'Seberapa aman dan didengar Anda merasa selama sesi?',
  reviewSeparate: 'Dua aspek ini dinilai terpisah dan tidak digabungkan menjadi satu skor.',
  reviewRequired: 'Pilih nilai untuk kedua aspek sebelum mengirim.',
  reviewAxisRequired: 'Pilih nilai untuk aspek ini.',
  reviewCommentLabel: 'Ceritakan pengalaman Anda (opsional)',
  reviewCommentHelp: 'Hindari menuliskan nomor telepon, email, atau alamat.',
  reviewCta: 'Kirim penilaian',
  reviewThanks: 'Terima kasih. Penilaian Anda sudah terkirim.',
  reviewAlready: 'Anda sudah menilai sesi ini.',
  reviewNotYet: 'Penilaian tersedia satu jam setelah sesi selesai.',
  reviewWrongBooking: 'Penilaian hanya untuk sesi yang sudah selesai.',
  reviewNone: 'Belum ada ulasan',
  reviewSendFailed: 'Penilaian belum terkirim.',

  // Mood check
  moodQuestion: 'Bagaimana tingkat beban akademik Anda setelah sesi ini?',
  moodOptions: [
    'Jauh lebih ringan',
    'Sedikit lebih ringan',
    'Tetap sama',
    'Sedikit lebih berat',
    'Jauh lebih berat',
  ],
  moodOptional: 'Jawaban ini opsional.',
  moodPrivacy: 'Jawaban ini bersifat pribadi. Mentor dan admin tidak dapat melihatnya.',
  moodDone: 'Terima kasih. Jawaban Anda tersimpan dan hanya dapat Anda lihat.',
  moodError: 'Jawaban belum tersimpan. Coba lagi.',

  // Verification / application
  evidenceMissing: '{n} bukti belum lengkap: {items}.',
  evidenceUnreadable: 'Berkas tidak dapat dibaca. Unggah ulang dalam format PDF, JPG, atau PNG.',
  reviewPendingTitle: 'Pengajuan sedang ditinjau',
  reviewPendingBody: 'Perkiraan keputusan 2–3 hari kerja sejak pengajuan dikirim.',
  rejectBannerTitle: 'Pengajuan Anda belum dapat disetujui.',
  rejectBannerBody:
    'Alasan: {reason}. Perbaiki butir yang ditandai lalu kirim ulang. Anda tidak perlu mengisi ulang data yang sudah terverifikasi.',
  rejectCta: 'Perbaiki pengajuan',
  resubmittedBanner:
    'Pengajuan Anda sudah dikirim ulang pada {tanggal} dan sedang ditinjau. Perkiraan keputusan 2–3 hari kerja.',
  resubmittedReviewerNote: 'Perlu diperiksa ulang',

  // Empty states
  emptyNoBookings: 'Belum ada booking',
  emptyNoRequests: 'Belum ada permintaan masuk',
  emptyQueueClear: 'Antrean kosong',
  emptyQueueClearBody: 'Tidak ada pengajuan yang menunggu.',
  emptyStoreUnpublished: 'Etalase belum terbit',
  noPackages: 'Belum ada paket',
  noMessages: 'Belum ada pesan.',

  // Not found
  notFoundTitle: 'Halaman tidak ditemukan',
  notFoundRecord: 'Data yang Anda cari tidak ditemukan.',
  notFoundRole: 'Halaman ini tidak tersedia untuk peran Anda.',

  // Navigation
  nav: {
    discover: 'Jelajahi mentor',
    myBookings: 'Booking saya',
    mentorDashboard: 'Dasbor',
    application: 'Pengajuan',
    studio: 'Etalase',
    premium: 'Premium',
    incoming: 'Permintaan masuk',
    queue: 'Verifikasi',
    badges: 'Badge',
    signIn: 'Masuk',
    signOut: 'Keluar',
    register: 'Daftar',
  },

  // Status pills (design-system §11.16)
  bookingStatus: {
    AWAITING_PAYMENT: 'Menunggu pembayaran',
    PAYMENT_FAILED: 'Pembayaran gagal',
    PAID: 'Menunggu kesepakatan',
    SCHEDULED: 'Terjadwal',
    COMPLETED: 'Selesai',
    REVIEWED: 'Sudah dinilai',
    CANCELLED: 'Dibatalkan',
  } as const,
  applicationStatus: {
    DRAFT: 'Draf',
    PENDING_REVIEW: 'Menunggu verifikasi',
    APPROVED: 'Disetujui',
    REJECTED: 'Perlu perbaikan',
    WITHDRAWN: 'Ditarik',
  } as const,
} as const;

export function formatRupiah(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
});

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  return `${dateTimeFormatter.format(new Date(iso))} WIB`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return dateFormatter.format(new Date(iso));
}

export function formatRating(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => String(values[key] ?? ''));
}
