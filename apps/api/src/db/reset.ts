import { rmSync } from 'node:fs';
import { config } from '../config.js';

if (config.env === 'production') {
  throw new Error('db:reset refuses to run with NODE_ENV=production');
}

for (const suffix of ['', '-wal', '-shm']) {
  rmSync(`${config.dbPath}${suffix}`, { force: true });
}

console.log(`Database reset: ${config.dbPath}`);

// Re-seed in the same process so reset always lands on the documented dataset.
await import('./seed.js');
