import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';
import { createApp } from '../src/app.js';
import { migrate, openDb } from '../src/db/index.js';

async function withServer(run: (baseUrl: string) => Promise<void>): Promise<void> {
  const db = openDb(':memory:');
  migrate(db);
  const server = createApp(db).listen(0);
  await new Promise<void>((resolve) => server.once('listening', resolve));
  const { port } = server.address() as AddressInfo;
  try {
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    db.close();
  }
}

test('GET /api/health reports the API and database as healthy', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/health`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      status: string;
      database: { status: string; users: number };
    };
    assert.equal(body.status, 'ok');
    assert.equal(body.database.status, 'ok');
    assert.equal(body.database.users, 0);
  });
});

test('GET /api/config serves the platform fee and tier labels from config', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/config`);
    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      platformFeeIdr: number;
      tierLabels: Record<string, string>;
    };
    assert.equal(typeof body.platformFeeIdr, 'number');
    assert.deepEqual(Object.keys(body.tierLabels).sort(), [
      'BASIC',
      'EDUCATOR_PREMIUM',
      'EDUCATOR_STANDARD',
    ]);
  });
});

test('unknown endpoints return the documented error envelope', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/does-not-exist`);
    assert.equal(response.status, 404);
    const body = (await response.json()) as { error: { code: string; message: string } };
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.ok(body.error.message.length > 0);
  });
});
