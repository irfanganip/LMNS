import { config } from '../config.js';
import { openDb, migrate } from './index.js';

/**
 * Deterministic seed. See docs/seed-data.md for the contract.
 * Re-running replaces the demo data with identical ids and timestamps.
 */

const SEEDED_AT = '2026-11-01T00:00:00.000Z';

/** Fixed offsets from SEEDED_AT so no wall clock enters the dataset. */
function at(dayOffset: number, hourOffset = 0): string {
  return new Date(
    Date.parse(SEEDED_AT) + dayOffset * 86_400_000 + hourOffset * 3_600_000,
  ).toISOString();
}

const domains = [
  ['ui.ac.id', 'Universitas Indonesia'],
  ['ugm.ac.id', 'Universitas Gadjah Mada'],
  ['itb.ac.id', 'Institut Teknologi Bandung'],
  ['unair.ac.id', 'Universitas Airlangga'],
  ['its.ac.id', 'Institut Teknologi Sepuluh Nopember'],
] as const;

type SeedUser = {
  id: string;
  email: string;
  role: 'MENTEE' | 'MENTOR' | 'ADMIN';
  verified: boolean;
};

const users: SeedUser[] = [
  { id: 'usr_rani', email: 'rani@ui.ac.id', role: 'MENTEE', verified: true },
  { id: 'usr_bayu', email: 'bayu@ugm.ac.id', role: 'MENTEE', verified: true },
  { id: 'usr_citra', email: 'citra@itb.ac.id', role: 'MENTEE', verified: true },
  { id: 'usr_sari', email: 'sari@ui.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_adi', email: 'adi@ui.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_hendra', email: 'hendra@ugm.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_dewi', email: 'dewi@unair.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_reviewer', email: 'reviewer@lmns.id', role: 'ADMIN', verified: true },
  // Additional marketplace supply so filters return meaningful and empty sets.
  { id: 'usr_maya', email: 'maya@itb.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_rizky', email: 'rizky@unair.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_putri', email: 'putri@ugm.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_agus', email: 'agus@ui.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_nina', email: 'nina@unair.ac.id', role: 'MENTOR', verified: true },
  { id: 'usr_tono', email: 'tono@its.ac.id', role: 'MENTOR', verified: true },
];

const menteeProfiles = [
  {
    userId: 'usr_rani',
    level: 'S1',
    university: 'Universitas Indonesia',
    facultyMajor: 'Ilmu Komputer / Sistem Informasi',
    semester: 6,
    goals: ['Thesis Anxiety', 'Research Methodology'],
    completed: true,
  },
  {
    userId: 'usr_bayu',
    level: 'S2',
    university: 'Universitas Gadjah Mada',
    facultyMajor: 'Sekolah Pascasarjana / Ilmu Lingkungan',
    semester: 2,
    goals: ['Overseas Scholarship Prep', 'Research Methodology'],
    completed: true,
  },
  {
    userId: 'usr_citra',
    level: 'S3',
    university: 'Institut Teknologi Bandung',
    facultyMajor: 'Teknik Informatika / Kecerdasan Artifisial',
    semester: 4,
    goals: ['Research Methodology', 'Burnout Prevention'],
    completed: true,
  },
] as const;

const mentorProfiles = [
  {
    userId: 'usr_sari',
    slug: 'sari-wulandari',
    name: 'Dr. Sari Wulandari',
    title: 'Dosen Pendidikan',
    institution: 'Universitas Indonesia',
    discipline: 'Education',
    tier: 'EDUCATOR_STANDARD',
    status: 'APPROVED',
    fee: 0,
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['SG'],
    degreeFocus: ['S2', 'S3'],
    research: ['Teacher Well-Being', 'Academic Burnout'],
  },
  {
    userId: 'usr_adi',
    slug: 'adi-prasetyo',
    name: 'Dr. Adi Prasetyo',
    title: 'Dosen Ilmu Komputer',
    institution: 'Universitas Indonesia',
    discipline: 'Computer Science',
    tier: 'EDUCATOR_PREMIUM',
    status: 'APPROVED',
    fee: 250_000,
    languages: ['id', 'en'],
    formats: ['online', 'in-person'],
    destinations: ['NL', 'AU'],
    degreeFocus: ['S2', 'S3'],
    research: ['Machine Learning', 'Doctoral Supervision'],
  },
  {
    userId: 'usr_hendra',
    slug: 'hendra-kusuma',
    name: 'Hendra Kusuma, M.Sc.',
    title: 'Peneliti Teknik Sipil',
    institution: 'Universitas Gadjah Mada',
    discipline: 'Engineering',
    tier: 'BASIC',
    status: 'PENDING_REVIEW',
    fee: 150_000,
    languages: ['id'],
    formats: ['online'],
    destinations: ['JP'],
    degreeFocus: ['S2'],
    research: ['Structural Health Monitoring'],
  },
  {
    userId: 'usr_dewi',
    slug: 'dewi-anggraini',
    name: 'Dewi Anggraini, M.Pd.',
    title: 'Dosen Pendidikan',
    institution: 'Universitas Airlangga',
    discipline: 'Education',
    tier: 'EDUCATOR_STANDARD',
    status: 'REJECTED',
    fee: 0,
    languages: ['id'],
    formats: ['online'],
    destinations: [],
    degreeFocus: ['S2'],
    research: ['Curriculum Design'],
  },
  {
    userId: 'usr_maya',
    slug: 'maya-lestari',
    name: 'Maya Lestari, M.Kom.',
    title: 'Rekayasa Perangkat Lunak',
    institution: 'Institut Teknologi Bandung',
    discipline: 'Computer Science',
    tier: 'BASIC',
    status: 'APPROVED',
    fee: 120_000,
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['AU'],
    degreeFocus: ['S2'],
    research: ['Software Engineering Education'],
  },
  {
    userId: 'usr_rizky',
    slug: 'rizky-hidayat',
    name: 'Rizky Hidayat, M.Kes.',
    title: 'Peneliti Kesehatan Masyarakat',
    institution: 'Universitas Airlangga',
    discipline: 'Public Health',
    tier: 'BASIC',
    status: 'APPROVED',
    fee: 100_000,
    languages: ['id'],
    formats: ['online', 'in-person'],
    destinations: [],
    degreeFocus: ['S2'],
    research: ['Public Health Policy'],
  },
  {
    userId: 'usr_putri',
    slug: 'putri-mahardika',
    name: 'Dr. Putri Mahardika',
    title: 'Dosen Ekonomi',
    institution: 'Universitas Gadjah Mada',
    discipline: 'Economics',
    tier: 'EDUCATOR_STANDARD',
    status: 'APPROVED',
    fee: 0,
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['NL'],
    degreeFocus: ['S3'],
    research: ['Development Economics'],
  },
  {
    userId: 'usr_agus',
    slug: 'agus-setiawan',
    name: 'Dr. Agus Setiawan',
    title: 'Dosen Hukum',
    institution: 'Universitas Indonesia',
    discipline: 'Law',
    tier: 'EDUCATOR_STANDARD',
    status: 'APPROVED',
    fee: 0,
    languages: ['id'],
    formats: ['online'],
    destinations: [],
    degreeFocus: ['S2', 'S3'],
    research: ['International Law'],
  },
  {
    userId: 'usr_nina',
    slug: 'nina-rahayu',
    name: 'Nina Rahayu, M.Ed.',
    title: 'Konsultan Pendidikan',
    institution: 'Universitas Airlangga',
    discipline: 'Education',
    tier: 'BASIC',
    status: 'APPROVED',
    fee: 90_000,
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['SG'],
    degreeFocus: ['S2'],
    research: ['Inclusive Education'],
  },
  {
    userId: 'usr_tono',
    slug: 'tono-wibowo',
    name: 'Dr. Tono Wibowo',
    title: 'Dosen Teknik Elektro',
    institution: 'Institut Teknologi Sepuluh Nopember',
    discipline: 'Engineering',
    tier: 'EDUCATOR_PREMIUM',
    status: 'APPROVED',
    fee: 300_000,
    languages: ['id', 'en'],
    formats: ['online', 'in-person'],
    destinations: ['JP', 'AU'],
    degreeFocus: ['S3'],
    research: ['Power Electronics'],
  },
] as const;

const pulses = [
  { id: 'pulse_rani_1', menteeId: 'usr_rani', stress: 3, tone: 'GENTLE', createdAt: SEEDED_AT },
  {
    id: 'pulse_citra_1',
    menteeId: 'usr_citra',
    stress: 4,
    tone: 'STRUCTURED',
    createdAt: SEEDED_AT,
  },
] as const;

const EVIDENCE_BASIC = {
  degreeUrl: 'https://example.com/hendra/ijazah.pdf',
  overseasExperienceUrl: 'https://example.com/hendra/japan-research',
  organisationUrl: 'https://ugm.ac.id/hendra-kusuma',
  googleScholarUrl: 'https://scholar.google.com/citations?user=hendra',
  linkedinUrl: 'https://www.linkedin.com/in/hendra-kusuma',
};

const applications = [
  {
    id: 'app_hendra',
    mentorId: 'usr_hendra',
    tier: 'BASIC',
    status: 'PENDING_REVIEW',
    step: 'REVIEW',
    name: 'Hendra Kusuma, M.Sc.',
    title: 'Peneliti Teknik Sipil',
    institution: 'Universitas Gadjah Mada',
    discipline: 'Engineering',
    submittedAt: at(0, -41),
    slaDueAt: at(3, -41),
    decidedAt: null,
    reason: null,
    evidence: EVIDENCE_BASIC,
  },
  {
    id: 'app_dewi',
    mentorId: 'usr_dewi',
    tier: 'EDUCATOR_STANDARD',
    status: 'REJECTED',
    step: 'REVIEW',
    name: 'Dewi Anggraini, M.Pd.',
    title: 'Dosen Pendidikan',
    institution: 'Universitas Airlangga',
    discipline: 'Education',
    submittedAt: at(-5),
    slaDueAt: at(-2),
    decidedAt: at(-4),
    reason: 'MISSING_EVIDENCE',
    evidence: {
      s3VerificationUrl: 'https://example.com/dewi/s3.pdf',
      institutionalEmailVerified: 'true',
      googleScholarUrl: 'https://scholar.google.com/citations?user=dewi',
      linkedinUrl: 'https://www.linkedin.com/in/dewi-anggraini',
    },
  },
  {
    id: 'app_sari',
    mentorId: 'usr_sari',
    tier: 'EDUCATOR_STANDARD',
    status: 'APPROVED',
    step: 'REVIEW',
    name: 'Dr. Sari Wulandari',
    title: 'Dosen Pendidikan',
    institution: 'Universitas Indonesia',
    discipline: 'Education',
    submittedAt: at(-30),
    slaDueAt: at(-27),
    decidedAt: at(-28),
    reason: 'VERIFIED',
    evidence: {
      s3VerificationUrl: 'https://example.com/sari/s3.pdf',
      overseasExperienceUrl: 'https://example.com/sari/nus-visiting-fellow',
      sisterId: '0123456789',
      institutionalEmailVerified: 'true',
      googleScholarUrl: 'https://scholar.google.com/citations?user=sari',
      linkedinUrl: 'https://www.linkedin.com/in/sari-wulandari',
    },
  },
  {
    id: 'app_adi',
    mentorId: 'usr_adi',
    tier: 'EDUCATOR_PREMIUM',
    status: 'APPROVED',
    step: 'REVIEW',
    name: 'Dr. Adi Prasetyo',
    title: 'Dosen Ilmu Komputer',
    institution: 'Universitas Indonesia',
    discipline: 'Computer Science',
    submittedAt: at(-40),
    slaDueAt: at(-37),
    decidedAt: at(-38),
    reason: 'VERIFIED',
    evidence: {
      s3VerificationUrl: 'https://example.com/adi/s3.pdf',
      overseasExperienceUrl: 'https://example.com/adi/tu-delft',
      scopusId: '57200012345',
      googleScholarUrl: 'https://scholar.google.com/citations?user=adi',
      linkedinUrl: 'https://www.linkedin.com/in/adi-prasetyo',
      certificateUrl: 'https://example.com/adi/coaching-certificate.pdf',
    },
  },
  {
    id: 'app_tono',
    mentorId: 'usr_tono',
    tier: 'EDUCATOR_PREMIUM',
    status: 'APPROVED',
    step: 'REVIEW',
    name: 'Dr. Tono Wibowo',
    title: 'Dosen Teknik Elektro',
    institution: 'Institut Teknologi Sepuluh Nopember',
    discipline: 'Engineering',
    submittedAt: at(-50),
    slaDueAt: at(-47),
    decidedAt: at(-48),
    reason: 'VERIFIED',
    evidence: {
      s3VerificationUrl: 'https://example.com/tono/s3.pdf',
      overseasExperienceUrl: 'https://example.com/tono/kyoto',
      scopusId: '57200098765',
      googleScholarUrl: 'https://scholar.google.com/citations?user=tono',
      linkedinUrl: 'https://www.linkedin.com/in/tono-wibowo',
      certificateUrl: 'https://example.com/tono/coaching-certificate.pdf',
    },
  },
] as const;

const storefronts = [
  {
    id: 'stf_sari',
    mentorId: 'usr_sari',
    applicationId: null,
    niche: 'Academic Burnout & Teacher Well-Being',
    intro:
      'Pendampingan tenang untuk mahasiswa yang kelelahan secara akademik, dengan fokus pada ritme kerja yang berkelanjutan.',
    philosophy:
      'Kesejahteraan bukan hadiah setelah selesai studi, melainkan prasyarat untuk berpikir jernih dan bertahan lama.',
    strengths: ['Burnout recovery', 'Thesis structure', 'Supervisor communication'],
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['SG'],
    packages: [{ id: 'pkg_sari_1', title: 'Konsultasi gratis 45 menit', price: 0, free: 1 }],
  },
  {
    id: 'stf_adi',
    mentorId: 'usr_adi',
    applicationId: null,
    niche: 'Doctoral Supervision & Machine Learning',
    intro:
      'Membantu mahasiswa S2/S3 merapikan pertanyaan riset, menuliskan kontribusi, dan menyiapkan studi lanjut di luar negeri.',
    philosophy:
      'Bimbingan yang baik mengurangi beban kognitif: satu langkah kecil yang jelas lebih baik daripada sepuluh target.',
    strengths: ['Research framing', 'Overseas scholarship', 'Publication strategy'],
    languages: ['id', 'en'],
    formats: ['online', 'in-person'],
    destinations: ['NL', 'AU'],
    packages: [
      {
        id: 'pkg_adi_1',
        title: 'Sesi bimbingan riset 60 menit',
        price: 250_000,
        free: 0,
      },
      {
        id: 'pkg_adi_2',
        title: 'Konsultasi gratis 30 menit',
        price: 0,
        free: 1,
      },
    ],
  },
  {
    id: 'stf_maya',
    mentorId: 'usr_maya',
    applicationId: null,
    niche: 'Software Engineering Portfolio',
    intro: 'Menyusun portofolio proyek dan persiapan magang untuk mahasiswa informatika.',
    philosophy: 'Belajar dengan proyek nyata yang cukup kecil untuk diselesaikan.',
    strengths: ['Portfolio review', 'Internship prep', 'Code review'],
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['AU'],
    packages: [{ id: 'pkg_maya_1', title: 'Review portofolio 60 menit', price: 120_000, free: 0 }],
  },
  {
    id: 'stf_rizky',
    mentorId: 'usr_rizky',
    applicationId: null,
    niche: 'Public Health Research',
    intro: 'Pendampingan metodologi penelitian kesehatan masyarakat dan penulisan artikel.',
    philosophy: 'Riset yang jujur dimulai dari pertanyaan yang cukup sempit.',
    strengths: ['Epidemiology', 'Mixed methods', 'Journal writing'],
    languages: ['id'],
    formats: ['online', 'in-person'],
    destinations: [],
    packages: [{ id: 'pkg_rizky_1', title: 'Sesi metodologi 60 menit', price: 100_000, free: 0 }],
  },
  {
    id: 'stf_putri',
    mentorId: 'usr_putri',
    applicationId: null,
    niche: 'Economics Thesis',
    intro: 'Diskusi terarah untuk mahasiswa ekonomi yang sedang menyusun skripsi atau tesis.',
    philosophy: 'Argumen yang baik lahir dari data yang dipahami, bukan dari teori yang dihafal.',
    strengths: ['Econometrics', 'Thesis structure', 'Data interpretation'],
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['NL'],
    packages: [{ id: 'pkg_putri_1', title: 'Konsultasi gratis 45 menit', price: 0, free: 1 }],
  },
  {
    id: 'stf_agus',
    mentorId: 'usr_agus',
    applicationId: null,
    niche: 'Law & Academic Writing',
    intro: 'Membantu penulisan hukum, riset normatif, dan persiapan moot court.',
    philosophy: 'Menulis hukum adalah berpikir tertib dan berani menguji asumsi sendiri.',
    strengths: ['Legal writing', 'Moot court', 'Case analysis'],
    languages: ['id'],
    formats: ['online'],
    destinations: [],
    packages: [{ id: 'pkg_agus_1', title: 'Konsultasi gratis 45 menit', price: 0, free: 1 }],
  },
  {
    id: 'stf_nina',
    mentorId: 'usr_nina',
    applicationId: null,
    niche: 'Inclusive Education',
    intro: 'Pendampingan mahasiswa dengan kebutuhan belajar beragam dan strategi belajar adaptif.',
    philosophy: 'Setiap mahasiswa butuh jalur yang berbeda, bukan standar yang sama.',
    strengths: ['Learning strategy', 'Accommodation', 'Study planning'],
    languages: ['id', 'en'],
    formats: ['online'],
    destinations: ['SG'],
    packages: [
      { id: 'pkg_nina_1', title: 'Sesi strategi belajar 60 menit', price: 90_000, free: 0 },
    ],
  },
  {
    id: 'stf_tono',
    mentorId: 'usr_tono',
    applicationId: null,
    niche: 'Engineering Doctoral Roadmap',
    intro: 'Menyiapkan rencana studi doktoral dan publikasi untuk lulusan teknik.',
    philosophy: 'Riset teknik yang baik adalah riset yang bisa diulang orang lain.',
    strengths: ['Doctoral roadmap', 'Publication', 'Lab management'],
    languages: ['id', 'en'],
    formats: ['online', 'in-person'],
    destinations: ['JP', 'AU'],
    packages: [
      { id: 'pkg_tono_1', title: 'Sesi roadmap doktoral 90 menit', price: 300_000, free: 0 },
    ],
  },
  {
    id: 'stf_hendra',
    mentorId: null,
    applicationId: 'app_hendra',
    niche: 'Engineering Research',
    intro: 'Pendampingan riset struktur dan persiapan studi ke Jepang.',
    philosophy: 'Riset yang baik dimulai dari pertanyaan yang dapat diuji.',
    strengths: ['Structural analysis', 'Lab work', 'Japanese scholarship'],
    languages: ['id'],
    formats: ['online'],
    destinations: ['JP'],
    packages: [{ id: 'pkg_hendra_1', title: 'Sesi riset 60 menit', price: 150_000, free: 0 }],
  },
  {
    id: 'stf_dewi',
    mentorId: null,
    applicationId: 'app_dewi',
    niche: 'Curriculum Design',
    intro: 'Pendampingan desain kurikulum dan asesmen pembelajaran.',
    philosophy: 'Kurikulum yang baik melayani mahasiswa, bukan sekadar administrasi.',
    strengths: ['Curriculum', 'Assessment', 'Lesson design'],
    languages: ['id'],
    formats: ['online'],
    destinations: [],
    packages: [{ id: 'pkg_dewi_1', title: 'Konsultasi gratis 45 menit', price: 0, free: 1 }],
  },
] as const;

const modules = [
  {
    id: 'm1',
    title: 'Well-Being First: Batas Peran Mentor',
    duration: 25,
    content:
      'Membedakan pendampingan akademik dari terapi klinis, mengenali batas kompetensi, dan menyiapkan rujukan.',
  },
  {
    id: 'm2',
    title: 'Mengenali Academic Burnout',
    duration: 30,
    content: 'Tanda awal kelelahan akademik, percakapan suportif, dan kapan menghentikan sesi.',
  },
  {
    id: 'm3',
    title: 'Mediasi Ekspektasi & Kesepakatan',
    duration: 20,
    content: 'Menyusun ruang lingkup, jadwal, dan biaya sesi yang eksplisit di ruang mediasi.',
  },
  {
    id: 'm4',
    title: 'Umpan Balik Dua Sumbu',
    duration: 25,
    content: 'Membaca umpan balik bimbingan akademik dan dukungan kesejahteraan secara terpisah.',
  },
] as const;

const bookings = [
  {
    id: 'bkg_rani_adi_1',
    menteeId: 'usr_rani',
    mentorId: 'usr_adi',
    packageId: 'pkg_adi_1',
    tier: 'EDUCATOR_PREMIUM',
    basis: 'PACKAGE_PRICE',
    status: 'COMPLETED',
    topic: 'Review Bab 3 disertasi',
    bottleneck: 'Saya bingung menyusun argumen kontribusi riset.',
    stress: 4,
    createdAt: at(-9),
    paidAt: at(-9, 1),
    scheduledAt: at(-8),
    completedAt: at(9),
    reviewEligibleAt: at(9, 1),
  },
  {
    id: 'bkg_citra_tono_1',
    menteeId: 'usr_citra',
    mentorId: 'usr_tono',
    packageId: 'pkg_tono_1',
    tier: 'EDUCATOR_PREMIUM',
    basis: 'PACKAGE_PRICE',
    status: 'PAID',
    topic: 'Roadmap doktoral di Jepang',
    bottleneck: 'Saya belum tahu kapan harus menghubungi supervisor.',
    stress: 3,
    createdAt: at(-3),
    paidAt: at(-3, 2),
    scheduledAt: null,
    completedAt: null,
    reviewEligibleAt: null,
  },
  {
    id: 'bkg_rani_sari_1',
    menteeId: 'usr_rani',
    mentorId: 'usr_sari',
    packageId: 'pkg_sari_1',
    tier: 'EDUCATOR_STANDARD',
    basis: 'RP_0',
    status: 'AWAITING_PAYMENT',
    topic: 'Kelelahan menulis skripsi',
    bottleneck: 'Saya menunda menulis karena takut hasilnya tidak cukup baik.',
    stress: 5,
    createdAt: at(0, -6),
    paidAt: null,
    scheduledAt: null,
    completedAt: null,
    reviewEligibleAt: null,
  },
  {
    id: 'bkg_citra_adi_rev',
    menteeId: 'usr_citra',
    mentorId: 'usr_adi',
    packageId: 'pkg_adi_1',
    tier: 'EDUCATOR_PREMIUM',
    basis: 'PACKAGE_PRICE',
    status: 'REVIEWED',
    topic: 'Publikasi konferensi',
    bottleneck: 'Abstrak saya selalu ditolak.',
    stress: 3,
    createdAt: at(-20),
    paidAt: at(-20, 1),
    scheduledAt: at(-19),
    completedAt: at(-18),
    reviewEligibleAt: at(-18, 1),
  },
  {
    id: 'bkg_rani_adi_rev',
    menteeId: 'usr_rani',
    mentorId: 'usr_adi',
    packageId: 'pkg_adi_2',
    tier: 'EDUCATOR_PREMIUM',
    basis: 'RP_0',
    status: 'REVIEWED',
    topic: 'Rencana studi lanjut',
    bottleneck: 'Saya belum menentukan program magister yang cocok.',
    stress: 2,
    createdAt: at(-15),
    paidAt: at(-15, 1),
    scheduledAt: at(-14),
    completedAt: at(-13),
    reviewEligibleAt: at(-13, 1),
  },
] as const;

const db = openDb();
migrate(db);

db.exec('BEGIN');
try {
  // Wipe demo data so the seed is repeatable; order respects foreign keys.
  for (const table of [
    'notifications',
    'audit_events',
    'templated_reasons',
    'mood_checks',
    'reviews',
    'alignment_item_confirmations',
    'alignment_items',
    'mediation_messages',
    'mediation_threads',
    'payments',
    'bookings',
    'training_attempts',
    'training_progress',
    'training_modules',
    'mentor_certificates',
    'premium_upgrade_requests',
    'mentor_badge_events',
    'mentor_badges',
    'application_events',
    'mentor_self_assessments',
    'application_evidence',
    'storefront_packages',
    'mentor_storefronts',
    'mentor_applications',
    'mentor_profiles',
    'well_being_pulses',
    'mentee_profiles',
    'otp_challenges',
    'sessions',
    'institution_domains',
    'users',
    'seed_meta',
  ]) {
    db.exec(`DELETE FROM ${table}`);
  }

  const insertDomain = db.prepare(
    'INSERT INTO institution_domains (domain, institution_name) VALUES (?, ?)',
  );
  for (const [domain, name] of domains) insertDomain.run(domain, name);

  const insertUser = db.prepare(
    'INSERT INTO users (id, email, role, email_verified_at, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  for (const user of users) {
    insertUser.run(user.id, user.email, user.role, user.verified ? SEEDED_AT : null, SEEDED_AT);
  }

  const insertMentee = db.prepare(
    `INSERT INTO mentee_profiles
       (user_id, academic_level, university, faculty_major, semester, goals_json, onboarding_completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const mentee of menteeProfiles) {
    insertMentee.run(
      mentee.userId,
      mentee.level,
      mentee.university,
      mentee.facultyMajor,
      mentee.semester,
      JSON.stringify(mentee.goals),
      mentee.completed ? SEEDED_AT : null,
    );
  }

  const insertPulse = db.prepare(
    'INSERT INTO well_being_pulses (id, mentee_id, answers, skipped, created_at) VALUES (?, ?, ?, 0, ?)',
  );
  for (const pulse of pulses) {
    insertPulse.run(
      pulse.id,
      pulse.menteeId,
      JSON.stringify({ workloadStress: pulse.stress, preferredTone: pulse.tone }),
      pulse.createdAt,
    );
  }

  const insertApplication = db.prepare(
    `INSERT INTO mentor_applications
       (id, mentor_id, tier, status, current_step, display_name, academic_title, institution,
        discipline, submitted_at, sla_due_at, decided_at, decision_reason_code, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertEvidence = db.prepare(
    `INSERT INTO application_evidence (application_id, key, mentor_id, value, verified_at, verified_by)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  for (const application of applications) {
    insertApplication.run(
      application.id,
      application.mentorId,
      application.tier,
      application.status,
      application.step,
      application.name,
      application.title,
      application.institution,
      application.discipline,
      application.submittedAt,
      application.slaDueAt,
      application.decidedAt,
      application.reason,
      application.submittedAt,
      application.decidedAt ?? application.submittedAt,
    );
    for (const [key, value] of Object.entries(application.evidence)) {
      insertEvidence.run(
        application.id,
        key,
        application.mentorId,
        value,
        application.status === 'APPROVED' ? application.decidedAt : null,
        application.status === 'APPROVED' ? 'usr_reviewer' : null,
      );
    }
  }

  const insertSelfAssessment = db.prepare(
    `INSERT INTO mentor_self_assessments (application_id, philosophy, boundaries, burnout_approach, completed_at)
     VALUES (?, ?, ?, ?, ?)`,
  );
  insertSelfAssessment.run(
    'app_hendra',
    'Saya percaya mahasiswa butuh ruang untuk berpikir tanpa tekanan tambahan.',
    'Saya tidak memberikan diagnosis klinis dan akan merujuk ke layanan kampus bila diperlukan.',
    'Saya membantu memecah beban kerja dan menetapkan jeda yang realistis.',
    at(0, -42),
  );
  insertSelfAssessment.run(
    'app_dewi',
    'Pendampingan yang baik adalah mendengar sebelum menyarankan.',
    'Saya membatasi sesi pada topik akademik dan tidak mencampur urusan pribadi.',
    'Saya mengajak mahasiswa mengenali tanda lelah dan mengatur ulang jadwal.',
    at(-5, -1),
  );

  const insertMentor = db.prepare(
    `INSERT INTO mentor_profiles
       (user_id, slug, display_name, academic_title, institution, discipline, tier, status,
        listed_at, session_fee_idr, languages, formats, research_focus_json,
        overseas_destinations_json, degree_focus_json, verified_links_json, source_application_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const mentor of mentorProfiles) {
    const application = applications.find((row) => row.mentorId === mentor.userId);
    insertMentor.run(
      mentor.userId,
      mentor.slug,
      mentor.name,
      mentor.title,
      mentor.institution,
      mentor.discipline,
      mentor.tier,
      mentor.status,
      mentor.status === 'APPROVED' ? SEEDED_AT : null,
      mentor.fee,
      JSON.stringify(mentor.languages),
      JSON.stringify(mentor.formats),
      JSON.stringify(mentor.research),
      JSON.stringify(mentor.destinations),
      JSON.stringify(mentor.degreeFocus),
      JSON.stringify({}),
      application?.id ?? null,
    );
  }

  const insertStorefront = db.prepare(
    `INSERT INTO mentor_storefronts
       (id, application_id, mentor_id, niche, intro, well_being_philosophy, intro_video_url,
        strengths_json, languages_json, formats_json, overseas_destinations_json, published, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?)`,
  );
  const insertPackage = db.prepare(
    `INSERT INTO storefront_packages
       (id, storefront_id, title, description, duration_minutes, price_idr, is_free_consultation, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const storefront of storefronts) {
    const published = storefront.mentorId !== null ? 1 : 0;
    insertStorefront.run(
      storefront.id,
      storefront.applicationId,
      storefront.mentorId,
      storefront.niche,
      storefront.intro,
      storefront.philosophy,
      JSON.stringify(storefront.strengths),
      JSON.stringify(storefront.languages),
      JSON.stringify(storefront.formats),
      JSON.stringify(storefront.destinations),
      published,
      SEEDED_AT,
    );
    storefront.packages.forEach((pkg, index) => {
      insertPackage.run(
        pkg.id,
        storefront.id,
        pkg.title,
        'Sesi pendampingan satu-satu bersama mentor terverifikasi.',
        60,
        pkg.price,
        pkg.free,
        index,
      );
    });
  }

  // Training content and Adi's completed premium track.
  const insertModule = db.prepare(
    'INSERT INTO training_modules (id, title, content, duration_minutes, position) VALUES (?, ?, ?, ?, ?)',
  );
  modules.forEach((module, index) => {
    insertModule.run(module.id, module.title, module.content, module.duration, index);
  });
  const insertProgress = db.prepare(
    'INSERT INTO training_progress (mentor_id, module_id, completed_at) VALUES (?, ?, ?)',
  );
  for (const module of modules) insertProgress.run('usr_adi', module.id, at(-20));
  db.prepare(
    `INSERT INTO training_attempts (id, mentor_id, module_batch, score, passed, answers_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'att_adi_1',
    'usr_adi',
    'premium-1',
    100,
    1,
    JSON.stringify([
      { questionId: 'q1', choice: 2 },
      { questionId: 'q2', choice: 0 },
      { questionId: 'q3', choice: 1 },
      { questionId: 'q4', choice: 2 },
      { questionId: 'q5', choice: 1 },
    ]),
    at(-19),
  );

  const insertUpgrade = db.prepare(
    `INSERT INTO premium_upgrade_requests
       (id, mentor_id, status, submitted_at, decided_at, decided_by, decision_reason_code, decision_note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
  );
  insertUpgrade.run(
    'upr_adi',
    'usr_adi',
    'APPROVED',
    at(-19),
    at(-10),
    'usr_reviewer',
    'VERIFIED',
    at(-20),
  );
  db.prepare(
    `INSERT INTO mentor_certificates
       (id, upgrade_request_id, file_name, issuer, file_url, issued_at, expires_at, verified_at, verified_by, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    'cert_adi',
    'upr_adi',
    'coaching-certificate.pdf',
    'LMNS',
    'demo-upload://coaching-certificate.pdf',
    at(-60),
    at(305),
    at(-10),
    'usr_reviewer',
    'VERIFIED',
  );

  const insertBadge = db.prepare(
    `INSERT INTO mentor_badges (id, mentor_id, type, issued_at, issued_by, revoked_at, revoke_reason, status)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, 'ACTIVE')`,
  );
  insertBadge.run('bdg_sari_sister', 'usr_sari', 'SISTER_VERIFIED', at(-27), 'usr_reviewer');
  insertBadge.run('bdg_adi_scopus', 'usr_adi', 'SCOPUS_ORCID_VERIFIED', at(-37), 'usr_reviewer');
  insertBadge.run('bdg_adi_lmns', 'usr_adi', 'LMNS_WELL_BEING_CERTIFIED', at(-10), 'usr_reviewer');
  insertBadge.run('bdg_tono_scopus', 'usr_tono', 'SCOPUS_ORCID_VERIFIED', at(-47), 'usr_reviewer');

  const badgeEvent = db.prepare(
    'INSERT INTO mentor_badge_events (id, badge_id, action, actor_id, reason, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
  );
  badgeEvent.run('bev_1', 'bdg_sari_sister', 'ISSUE', 'usr_reviewer', at(-27));
  badgeEvent.run('bev_2', 'bdg_adi_scopus', 'ISSUE', 'usr_reviewer', at(-37));
  badgeEvent.run('bev_3', 'bdg_adi_lmns', 'ISSUE', 'usr_reviewer', at(-10));
  badgeEvent.run('bev_4', 'bdg_tono_scopus', 'ISSUE', 'usr_reviewer', at(-47));

  const insertBooking = db.prepare(
    `INSERT INTO bookings
       (id, mentee_id, mentor_id, package_id, tier_snapshot, session_fee_basis, status,
        platform_fee_idr, intake_topic, intake_bottleneck, intake_stress_level, created_at,
        paid_at, scheduled_at, completed_at, cancelled_at, cancel_reason, review_eligible_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?)`,
  );
  for (const booking of bookings) {
    insertBooking.run(
      booking.id,
      booking.menteeId,
      booking.mentorId,
      booking.packageId,
      booking.tier,
      booking.basis,
      booking.status,
      config.platformFeeIdr,
      booking.topic,
      booking.bottleneck,
      booking.stress,
      booking.createdAt,
      booking.paidAt,
      booking.scheduledAt,
      booking.completedAt,
      booking.reviewEligibleAt,
    );
  }

  const insertPayment = db.prepare(
    `INSERT INTO payments
       (id, booking_id, provider, ewallet, amount_idr, status, failure_code, idempotency_key,
        instructions_json, receipt_number, test_outcome, created_at, expires_at, paid_at)
     VALUES (?, ?, ?, NULL, ?, ?, NULL, ?, ?, ?, 'SUCCESS', ?, ?, ?)`,
  );
  insertPayment.run(
    'pay_rani_adi_1',
    'bkg_rani_adi_1',
    'QRIS',
    config.platformFeeIdr,
    'SUCCEEDED',
    'idem_pay_rani_adi_1',
    JSON.stringify({ qrString: 'DEMO-QRIS-pay_rani_adi_1', virtualAccount: null }),
    'LMNS-2026-0001',
    at(-9),
    at(-9, 1),
    at(-9, 1),
  );
  insertPayment.run(
    'pay_citra_tono_1',
    'bkg_citra_tono_1',
    'VIRTUAL_ACCOUNT',
    config.platformFeeIdr,
    'SUCCEEDED',
    'idem_pay_citra_tono_1',
    JSON.stringify({ qrString: null, virtualAccount: '880812345678' }),
    'LMNS-2026-0002',
    at(-3),
    at(-3, 1),
    at(-3, 2),
  );
  insertPayment.run(
    'pay_rani_sari_1',
    'bkg_rani_sari_1',
    'QRIS',
    config.platformFeeIdr,
    'PENDING',
    'idem_pay_rani_sari_1',
    JSON.stringify({ qrString: 'DEMO-QRIS-pay_rani_sari_1', virtualAccount: null }),
    null,
    at(0, -6),
    at(0, -5),
    null,
  );

  const insertThread = db.prepare(
    'INSERT INTO mediation_threads (id, booking_id, status, opened_at, closed_at) VALUES (?, ?, ?, ?, NULL)',
  );
  const threadSeeds = [
    ['thr_rani_adi_1', 'bkg_rani_adi_1', 'OPEN', at(-9, 1)],
    ['thr_citra_tono_1', 'bkg_citra_tono_1', 'OPEN', at(-3, 2)],
  ] as const;
  for (const [id, bookingId, status, openedAt] of threadSeeds) {
    insertThread.run(id, bookingId, status, openedAt);
  }

  const insertMessage = db.prepare(
    `INSERT INTO mediation_messages (id, thread_id, sender_id, sender_role, body, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const messageSeeds = [
    [
      'msg_c1',
      'thr_citra_tono_1',
      'usr_citra',
      'MENTEE',
      'Selamat siang Dok, saya ingin memastikan ruang lingkup sesi.',
      at(-3, 3),
    ],
    [
      'msg_c2',
      'thr_citra_tono_1',
      'usr_tono',
      'MENTOR',
      'Siang, Citra. Silakan sampaikan bagian mana yang paling mendesak.',
      at(-3, 4),
    ],
    [
      'msg_c3',
      'thr_citra_tono_1',
      'usr_citra',
      'MENTEE',
      'Saya ingin membahas pemilihan supervisor di Jepang dan timeline aplikasinya.',
      at(-3, 5),
    ],
    [
      'msg_c4',
      'thr_citra_tono_1',
      'usr_tono',
      'MENTOR',
      'Baik, saya usulkan kita susun jadwal satu jam minggu depan.',
      at(-2, 1),
    ],
  ] as const;
  for (const message of messageSeeds) insertMessage.run(...message);

  const insertItem = db.prepare(
    `INSERT INTO alignment_items (id, booking_id, key, value_json, version, proposed_by, proposed_at, confirmed)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertConfirmation = db.prepare(
    'INSERT INTO alignment_item_confirmations (item_id, user_id, item_version, confirmed_at) VALUES (?, ?, ?, ?)',
  );

  // Rani ↔ Adi: every item proposed and confirmed by both parties.
  insertItem.run(
    'ali_rani_scope',
    'bkg_rani_adi_1',
    'scope',
    JSON.stringify({
      text: 'Review Bab 3, 2 sesi, catatan tertulis maksimal 3 hari setelah sesi.',
    }),
    1,
    'usr_adi',
    at(-9, 2),
    1,
  );
  insertItem.run(
    'ali_rani_schedule',
    'bkg_rani_adi_1',
    'schedule',
    JSON.stringify({
      startsAt: at(-8),
      durationMinutes: 60,
      videoUrl: 'https://meet.example.com/rani-adi',
    }),
    1,
    'usr_adi',
    at(-9, 2),
    1,
  );
  insertItem.run(
    'ali_rani_fee',
    'bkg_rani_adi_1',
    'fee',
    JSON.stringify({
      amountIdr: 250_000,
      method: 'BANK_TRANSFER',
      settlementNote: 'BCA 1234567890 a.n. Adi Prasetyo',
    }),
    1,
    'usr_adi',
    at(-9, 2),
    1,
  );
  for (const itemId of ['ali_rani_scope', 'ali_rani_schedule', 'ali_rani_fee']) {
    insertConfirmation.run(itemId, 'usr_rani', 1, at(-9, 3));
    insertConfirmation.run(itemId, 'usr_adi', 1, at(-9, 3));
  }

  // Citra ↔ Tono: scope confirmed by the mentee only, schedule and fee unconfirmed.
  insertItem.run(
    'ali_citra_scope',
    'bkg_citra_tono_1',
    'scope',
    JSON.stringify({ text: 'Roadmap aplikasi doktoral Jepang dan daftar supervisor potensial.' }),
    1,
    'usr_tono',
    at(-3, 3),
    1,
  );
  insertItem.run(
    'ali_citra_schedule',
    'bkg_citra_tono_1',
    'schedule',
    JSON.stringify({
      startsAt: at(5, 2),
      durationMinutes: 90,
      videoUrl: 'https://meet.example.com/citra-tono',
    }),
    1,
    'usr_tono',
    at(-2, 1),
    0,
  );
  insertItem.run(
    'ali_citra_fee',
    'bkg_citra_tono_1',
    'fee',
    JSON.stringify({
      amountIdr: 300_000,
      method: 'BANK_TRANSFER',
      settlementNote: 'BNI 9876543210 a.n. Tono Wibowo',
    }),
    1,
    'usr_tono',
    at(-2, 1),
    0,
  );
  insertConfirmation.run('ali_citra_scope', 'usr_citra', 1, at(-3, 4));

  const insertReview = db.prepare(
    `INSERT INTO reviews
       (id, booking_id, mentee_id, mentor_id, academic_guidance, well_being_support, comment, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', ?)`,
  );
  insertReview.run(
    'rev_1',
    'bkg_citra_adi_rev',
    'usr_citra',
    'usr_adi',
    5,
    4,
    'Sangat membantu merapikan abstrak, tapi saya butuh waktu lebih untuk diskusi.',
    at(-17),
  );
  insertReview.run(
    'rev_2',
    'bkg_rani_adi_rev',
    'usr_rani',
    'usr_adi',
    4,
    5,
    'Arahan akademiknya jelas dan saya merasa lebih tenang setelah sesi.',
    at(-12),
  );
  const insertMood = db.prepare(
    'INSERT INTO mood_checks (id, review_id, booking_id, mentee_id, stress_level, created_at) VALUES (?, ?, ?, ?, ?, ?)',
  );
  insertMood.run('mod_1', 'rev_1', 'bkg_citra_adi_rev', 'usr_citra', 2, at(-17));
  insertMood.run('mod_2', 'rev_2', 'bkg_rani_adi_rev', 'usr_rani', 3, at(-12));

  const insertReason = db.prepare(
    'INSERT INTO templated_reasons (code, scope, label, text) VALUES (?, ?, ?, ?)',
  );
  insertReason.run(
    'MISSING_EVIDENCE',
    'APPLICATION',
    'Bukti kredensial belum lengkap',
    'Bukti kredensial belum lengkap. Lengkapi tautan yang ditandai lalu kirim ulang aplikasi.',
  );
  insertReason.run(
    'DOMAIN_INVALID',
    'APPLICATION',
    'Domain email tidak diizinkan',
    'Email harus menggunakan domain kampus yang terdaftar (.ac.id atau .edu).',
  );
  insertReason.run(
    'SELF_ASSESSMENT_INCOMPLETE',
    'APPLICATION',
    'Asesmen diri belum lengkap',
    'Asesmen diri kesejahteraan wajib diisi sebelum aplikasi dapat diverifikasi.',
  );
  insertReason.run(
    'CERTIFICATE_INVALID',
    'UPGRADE',
    'Sertifikat coaching tidak valid',
    'Sertifikat coaching tidak dapat diverifikasi. Unggah sertifikat yang masih berlaku.',
  );
  insertReason.run(
    'VERIFIED',
    'UPGRADE',
    'Terverifikasi',
    'Sertifikat dan prasyarat lain terverifikasi.',
  );

  const insertNotification = db.prepare(
    'INSERT INTO notifications (id, user_id, type, payload_json, read_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)',
  );
  insertNotification.run(
    'ntf_rani_review',
    'usr_rani',
    'REVIEW_PROMPT',
    JSON.stringify({ bookingId: 'bkg_rani_adi_1' }),
    at(0, 1),
  );
  insertNotification.run(
    'ntf_citra_align',
    'usr_citra',
    'ALIGNMENT_CONFIRMED',
    JSON.stringify({ bookingId: 'bkg_citra_tono_1' }),
    at(-3, 5),
  );
  insertNotification.run(
    'ntf_sari_paid',
    'usr_sari',
    'BOOKING_PAID',
    JSON.stringify({ bookingId: 'bkg_rani_sari_1' }),
    at(0, -6),
  );

  const insertAudit = db.prepare(
    `INSERT INTO audit_events (id, entity_type, entity_id, actor_id, action, reason_code, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insertAudit.run(
    'aud_dewi_reject',
    'APPLICATION',
    'app_dewi',
    'usr_reviewer',
    'REJECT',
    'MISSING_EVIDENCE',
    'SISTER ID belum diisi.',
    at(-4),
  );
  insertAudit.run(
    'aud_adi_approve',
    'APPLICATION',
    'app_adi',
    'usr_reviewer',
    'APPROVE',
    'VERIFIED',
    null,
    at(-38),
  );

  const insertMeta = db.prepare('INSERT INTO seed_meta (key, value) VALUES (?, ?)');
  insertMeta.run('seeded_at', SEEDED_AT);
  insertMeta.run('demo_otp', config.demoOtp);
  insertMeta.run('platform_fee_idr', String(config.platformFeeIdr));

  db.exec('COMMIT');
} catch (error) {
  db.exec('ROLLBACK');
  throw error;
}

console.log(
  `Seeded ${config.dbPath}: ${users.length} accounts, ${mentorProfiles.length} mentor profiles, ` +
    `${mentorProfiles.filter((mentor) => mentor.status === 'APPROVED').length} listed mentors.`,
);
db.close();
