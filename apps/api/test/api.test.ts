import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test, { afterEach, beforeEach } from 'node:test';
import { createApp } from '../src/app.js';
import type { Db } from '../src/db/index.js';
import { openDb } from '../src/db/index.js';
import { createSession } from '../src/repos/identity.js';

const apiRoot = path.resolve(import.meta.dirname, '..');
let db: Db;
let server: ReturnType<ReturnType<typeof createApp>['listen']>;
let baseUrl: string;
let tempDir: string;

async function seed(databasePath: string): Promise<void> {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/db/seed.ts'], {
    cwd: apiRoot,
    env: { ...process.env, DATABASE_PATH: databasePath },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
}

beforeEach(async () => {
  tempDir = mkdtempSync(path.join(tmpdir(), 'lmns-test-'));
  const databasePath = path.join(tempDir, 'lmns.db');
  await seed(databasePath);
  db = openDb(databasePath);
  server = createApp(db).listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  db.close();
  rmSync(tempDir, { recursive: true, force: true });
});

async function api(
  method: string,
  route: string,
  options: { token?: string; body?: unknown } = {},
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- tests assert on dynamic JSON shapes
): Promise<{ status: number; body: any }> {
  const response = await fetch(`${baseUrl}/api${route}`, {
    method,
    headers: {
      ...(options.body === undefined ? {} : { 'content-type': 'application/json' }),
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  return { status: response.status, body: await response.json() };
}

async function login(email: string): Promise<string> {
  const response = await api('POST', '/auth/login', { body: { email } });
  assert.equal(response.status, 200);
  return response.body.token;
}

test('discovery lists only approved, verified mentors and hides pending/rejected profiles (G2)', async () => {
  const list = await api('GET', '/mentors');
  assert.equal(list.status, 200);
  assert.equal(list.body.total, 8);
  const slugs = list.body.items.map((mentor: { slug: string }) => mentor.slug);
  assert.ok(!slugs.includes('hendra-kusuma'));
  assert.ok(!slugs.includes('dewi-anggraini'));

  assert.equal((await api('GET', '/mentors/hendra-kusuma')).status, 404);
  assert.equal((await api('GET', '/mentors/dewi-anggraini')).status, 404);
});

test('unverified mentee cannot request a booking (G1)', async () => {
  const now = '2026-11-01T00:00:00.000Z';
  db.prepare(
    'INSERT INTO users (id, email, role, email_verified_at, created_at) VALUES (?, ?, ?, NULL, ?)',
  ).run('usr_unverified', 'unverified@ui.ac.id', 'MENTEE', now);
  db.prepare(
    `INSERT INTO mentee_profiles
       (user_id, academic_level, university, faculty_major, semester, goals_json, onboarding_completed_at)
     VALUES (?, 'S1', 'Universitas Indonesia', 'Ilmu Komputer', 2, '[]', ?)`,
  ).run('usr_unverified', now);
  createSession(db, 'ses_unverified', 'usr_unverified');

  const response = await api('POST', '/bookings', {
    token: 'ses_unverified',
    body: {
      mentorId: 'usr_adi',
      packageId: 'pkg_adi_1',
      intakeNote: { topic: 'Topik', bottleneck: 'Hambatan', stressLevel: 3 },
    },
  });
  assert.equal(response.status, 403);
  assert.equal(response.body.error.code, 'MENTEE_NOT_VERIFIED');
});

test('mediation thread and receipt stay locked until the platform fee is paid (G3)', async () => {
  const token = await login('rani@ui.ac.id');
  const thread = await api('GET', '/bookings/bkg_rani_sari_1/thread', { token });
  assert.equal(thread.status, 402);
  assert.equal(thread.body.error.code, 'PAYMENT_REQUIRED');

  const receipt = await api('GET', '/bookings/bkg_rani_sari_1/receipt', { token });
  assert.equal(receipt.status, 402);

  const paidThread = await api('GET', '/bookings/bkg_rani_adi_1/thread', { token });
  assert.equal(paidThread.status, 200);
});

test('a booking becomes SCHEDULED only after both parties confirm every alignment item (G4)', async () => {
  const citra = await login('citra@itb.ac.id');
  const tono = await login('tono@its.ac.id');

  for (const key of ['schedule', 'fee']) {
    assert.equal(
      (await api('POST', `/bookings/bkg_citra_tono_1/alignment/${key}/confirm`, { token: citra }))
        .status,
      200,
    );
  }
  const partial = await api('GET', '/bookings/bkg_citra_tono_1', { token: citra });
  assert.equal(partial.body.status, 'PAID');

  for (const key of ['scope', 'schedule', 'fee']) {
    assert.equal(
      (await api('POST', `/bookings/bkg_citra_tono_1/alignment/${key}/confirm`, { token: tono }))
        .status,
      200,
    );
  }
  const scheduled = await api('GET', '/bookings/bkg_citra_tono_1', { token: citra });
  assert.equal(scheduled.body.status, 'SCHEDULED');
});

test('a second review for the same completed booking is rejected (G5)', async () => {
  const token = await login('rani@ui.ac.id');
  const state = await api('GET', '/bookings/bkg_rani_adi_rev/review', { token });
  assert.equal(state.status, 200);
  assert.equal(state.body.reason, 'ALREADY_SUBMITTED');

  const again = await api('POST', '/bookings/bkg_rani_adi_rev/review', {
    token,
    body: { academicGuidance: 5, wellBeingSupport: 5 },
  });
  assert.equal(again.status, 409);
  assert.equal(again.body.error.code, 'REVIEW_ALREADY_SUBMITTED');
});

test('pulse and mood values never reach mentor or admin responses (G6)', async () => {
  const mentee = await login('rani@ui.ac.id');
  const pulse = await api('POST', '/me/pulses', {
    token: mentee,
    body: { answers: { workloadStress: 5, researchBlocker: 4, preferredTone: 'GENTLE' } },
  });
  assert.equal(pulse.status, 201);

  const mentor = await login('adi@ui.ac.id');
  const thread = await api('GET', '/bookings/bkg_rani_adi_1/thread', { token: mentor });
  assert.equal(thread.status, 200);
  const threadText = JSON.stringify(thread.body);
  assert.ok(!threadText.includes('workloadStress'));
  assert.ok(!threadText.includes('preferredTone'));

  const admin = await login('reviewer@lmns.id');
  const queue = await api('GET', '/admin/applications/app_hendra', { token: admin });
  assert.equal(queue.status, 200);
  assert.ok(!JSON.stringify(queue.body).includes('workloadStress'));
});

test('story path: registration, pulse, payment, mediation, completion and review', async () => {
  const registration = await api('POST', '/auth/register', {
    body: {
      email: 'newbie@ui.ac.id',
      academicLevel: 'S1',
      university: 'Universitas Indonesia',
      facultyMajor: 'Ilmu Komputer',
      semester: 2,
      goals: ['Research Methodology'],
    },
  });
  assert.equal(registration.status, 201);
  const verified = await api('POST', '/auth/register/verify', {
    body: { email: 'newbie@ui.ac.id', otp: registration.body.otp.demoOtp },
  });
  assert.equal(verified.status, 201);

  const bayu = await login('bayu@ugm.ac.id');
  const created = await api('POST', '/bookings', {
    token: bayu,
    body: {
      mentorId: 'usr_maya',
      packageId: 'pkg_maya_1',
      intakeNote: { topic: 'Portofolio', bottleneck: 'Belum ada proyek', stressLevel: 3 },
    },
  });
  assert.equal(created.status, 201);
  const bookingId = created.body.booking.id;

  const payment = await api('POST', `/bookings/${bookingId}/payments`, {
    token: bayu,
    body: { provider: 'QRIS', testOutcome: 'SUCCESS' },
  });
  assert.equal(payment.status, 201);
  const confirmed = await api(
    'POST',
    `/bookings/${bookingId}/payments/${payment.body.id}/confirm`,
    { token: bayu, body: {} },
  );
  assert.equal(confirmed.status, 200);
  assert.match(confirmed.body.receipt.receiptNumber, /^LMNS-\d{4}-\d{4}$/);

  assert.equal(
    (await api('POST', `/bookings/${bookingId}/messages`, { token: bayu, body: { body: 'Halo.' } }))
      .status,
    201,
  );

  const startsAt = new Date(Date.now() + 2 * 3_600_000).toISOString();
  const items: Record<string, unknown> = {
    scope: { text: 'Review portofolio dan rencana magang.' },
    schedule: { startsAt, durationMinutes: 60, videoUrl: 'https://meet.example.com/abc' },
    fee: { amountIdr: 120_000, method: 'BANK_TRANSFER', settlementNote: 'BCA 123' },
  };
  for (const [key, value] of Object.entries(items)) {
    assert.equal(
      (await api('PUT', `/bookings/${bookingId}/alignment/${key}`, { token: bayu, body: value }))
        .status,
      200,
    );
  }

  const maya = await login('maya@itb.ac.id');
  for (const key of Object.keys(items)) {
    await api('POST', `/bookings/${bookingId}/alignment/${key}/confirm`, { token: bayu });
    await api('POST', `/bookings/${bookingId}/alignment/${key}/confirm`, { token: maya });
  }
  assert.equal(
    (await api('GET', `/bookings/${bookingId}`, { token: bayu })).body.status,
    'SCHEDULED',
  );

  const completed = await api('POST', `/bookings/${bookingId}/complete`, { token: bayu });
  assert.equal(completed.status, 200);

  // The contract waits an hour before review; move the clock forward in the fixture.
  db.prepare('UPDATE bookings SET review_eligible_at = ? WHERE id = ?').run(
    '2026-11-01T00:00:00.000Z',
    bookingId,
  );
  const review = await api('POST', `/bookings/${bookingId}/review`, {
    token: bayu,
    body: {
      academicGuidance: 5,
      wellBeingSupport: 4,
      comment: 'Membantu.',
      moodCheck: { stressLevel: 2 },
    },
  });
  assert.equal(review.status, 201);

  const profile = await api('GET', '/mentors/maya-lestari');
  assert.equal(profile.body.reviews.aggregates.academicGuidance, 5);
  assert.equal(profile.body.reviews.aggregates.wellBeingSupport, 4);
  assert.equal(profile.body.reviews.aggregates.blended, undefined);
});

test('story path: admin approves a pending application and publishes the mentor (US 4)', async () => {
  const admin = await login('reviewer@lmns.id');
  const queue = await api('GET', '/admin/applications?status=PENDING_REVIEW', { token: admin });
  assert.equal(queue.status, 200);
  assert.ok(
    queue.body.items.some(
      (item: { application: { id: string } }) => item.application.id === 'app_hendra',
    ),
  );

  const decision = await api('POST', '/admin/applications/app_hendra/decision', {
    token: admin,
    body: { decision: 'APPROVE' },
  });
  assert.equal(decision.status, 200);
  assert.equal(decision.body.status, 'APPROVED');

  const discovered = await api('GET', '/mentors?q=hendra');
  assert.equal(discovered.body.total, 1);
  const audit = await api('GET', '/admin/audit?entityType=APPLICATION&entityId=app_hendra', {
    token: admin,
  });
  assert.ok(audit.body.items.some((item: { action: string }) => item.action === 'APPROVE'));
});

test('story path: premium upgrade auto-issues the well-being badge after verification (US 2.2)', async () => {
  const sari = await login('sari@ui.ac.id');
  for (const id of ['m1', 'm2', 'm3', 'm4']) {
    assert.equal(
      (await api('POST', `/training/modules/${id}/complete`, { token: sari })).status,
      200,
    );
  }
  const assessment = await api('POST', '/mentor/upgrade/assessment', {
    token: sari,
    body: {
      answers: [
        { questionId: 'q1', choice: 2 },
        { questionId: 'q2', choice: 0 },
        { questionId: 'q3', choice: 1 },
        { questionId: 'q4', choice: 2 },
        { questionId: 'q5', choice: 1 },
      ],
    },
  });
  assert.equal(assessment.body.passed, true);

  assert.equal(
    (
      await api('POST', '/mentor/upgrade/certificate', {
        token: sari,
        body: {
          fileName: 'sertifikat-coaching.pdf',
          issuer: 'LMNS',
          issuedAt: '2026-10-01',
          expiresAt: '2028-10-01',
        },
      })
    ).status,
    201,
  );

  const submitted = await api('POST', '/mentor/upgrade/submit', { token: sari });
  assert.equal(submitted.status, 202);

  const admin = await login('reviewer@lmns.id');
  const decision = await api(
    'POST',
    `/admin/upgrades/${submitted.body.upgradeRequestId}/decision`,
    {
      token: admin,
      body: { decision: 'APPROVE', reasonCode: 'VERIFIED' },
    },
  );
  assert.equal(decision.status, 200);
  assert.equal(decision.body.mentorTier, 'EDUCATOR_PREMIUM');

  const profile = await api('GET', '/mentors/sari-wulandari');
  assert.equal(profile.body.tier, 'EDUCATOR_PREMIUM');
  assert.ok(
    profile.body.badges.some(
      (badge: { type: string }) => badge.type === 'LMNS_WELL_BEING_CERTIFIED',
    ),
  );
});
