/**
 * Seeded demo accounts (docs/prototype-scope.md §5). Sign-in is email-only in
 * the prototype, so this list is what the sign-in screen and the persona
 * switcher render. Labels describe the state each account demonstrates.
 */

export type DemoAccount = {
  email: string;
  name: string;
  role: 'MENTEE' | 'MENTOR' | 'ADMIN';
  state: string;
};

export const demoAccounts: DemoAccount[] = [
  {
    email: 'rani@ui.ac.id',
    name: 'Rani Kusuma',
    role: 'MENTEE',
    state: 'Mentee · satu sesi selesai menunggu ulasan',
  },
  {
    email: 'bayu@ugm.ac.id',
    name: 'Bayu Saputra',
    role: 'MENTEE',
    state: 'Mentee · belum ada booking',
  },
  {
    email: 'citra@itb.ac.id',
    name: 'Citra Lestari',
    role: 'MENTEE',
    state: 'Mentee · kesepakatan satu sisi',
  },
  {
    email: 'sari@ui.ac.id',
    name: 'Dr. Sari Wulandari',
    role: 'MENTOR',
    state: 'Mentor Educator · Rp 0, permintaan masuk',
  },
  {
    email: 'adi@ui.ac.id',
    name: 'Dr. Adi Prasetyo',
    role: 'MENTOR',
    state: 'Mentor Premium · badge terbit',
  },
  {
    email: 'hendra@ugm.ac.id',
    name: 'Hendra Kusuma',
    role: 'MENTOR',
    state: 'Pemohon mentor · menunggu verifikasi',
  },
  {
    email: 'dewi@unair.ac.id',
    name: 'Dewi Kartika',
    role: 'MENTOR',
    state: 'Pemohon mentor · ditolak, perlu perbaikan',
  },
  {
    email: 'reviewer@lmns.id',
    name: 'Verifier LMNS',
    role: 'ADMIN',
    state: 'Admin · antrean verifikasi',
  },
];

export const demoOtp = '123456';

export function roleLabel(role: DemoAccount['role']): string {
  if (role === 'MENTEE') return 'Mentee';
  if (role === 'MENTOR') return 'Mentor';
  return 'Admin';
}
