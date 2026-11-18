import { config } from '../config.js';
import { openDb, migrate } from './index.js';

/**
 * Deterministic seed. See docs/seed-data.md for the contract.
 * Re-running replaces the demo data with identical ids and timestamps.
 */

const seededAt = '2026-11-01T00:00:00.000Z';

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
  },
] as const;

const pulses = [
  { id: 'pulse_rani_1', menteeId: 'usr_rani', stress: 3, tone: 'GENTLE', createdAt: seededAt },
  {
    id: 'pulse_citra_1',
    menteeId: 'usr_citra',
    stress: 4,
    tone: 'STRUCTURED',
    createdAt: seededAt,
  },
] as const;

const db = openDb();
migrate(db);

db.exec('BEGIN');
try {
  // Wipe demo data so the seed is repeatable; order respects foreign keys.
  for (const table of [
    'well_being_pulses',
    'sessions',
    'mentor_profiles',
    'mentee_profiles',
    'users',
    'institution_domains',
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
    insertUser.run(user.id, user.email, user.role, user.verified ? seededAt : null, seededAt);
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
      seededAt,
    );
  }

  const insertMentor = db.prepare(
    `INSERT INTO mentor_profiles
       (user_id, slug, display_name, academic_title, institution, discipline, tier, status,
        listed_at, session_fee_idr, languages, formats)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  for (const mentor of mentorProfiles) {
    insertMentor.run(
      mentor.userId,
      mentor.slug,
      mentor.name,
      mentor.title,
      mentor.institution,
      mentor.discipline,
      mentor.tier,
      mentor.status,
      mentor.status === 'APPROVED' ? seededAt : null,
      mentor.fee,
      JSON.stringify(mentor.languages),
      JSON.stringify(mentor.formats),
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

  const insertMeta = db.prepare('INSERT INTO seed_meta (key, value) VALUES (?, ?)');
  insertMeta.run('seeded_at', seededAt);
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
