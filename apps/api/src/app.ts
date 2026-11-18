import express from 'express';
import type { Express } from 'express';
import type { Db } from './db/index.js';
import { demoConfig } from './config.js';
import { countRows, seededAt } from './db/index.js';
import { errorHandler, notFound } from './http/errors.js';
import { buildRouter } from './routes/index.js';

/**
 * Builds the API app. Routes added by later tasks mount under `/api` and must
 * follow docs/api-contract.md.
 */
export function createApp(db: Db): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    let database: {
      status: 'ok' | 'error';
      seededAt: string | null;
      users: number;
      mentors: number;
    };
    try {
      database = {
        status: 'ok',
        seededAt: seededAt(db),
        users: countRows(db, 'users'),
        mentors: countRows(db, 'mentor_profiles'),
      };
    } catch {
      database = { status: 'error', seededAt: null, users: 0, mentors: 0 };
    }

    res.status(database.status === 'ok' ? 200 : 503).json({
      status: database.status === 'ok' ? 'ok' : 'degraded',
      service: 'lmns-api',
      version: '0.1.0',
      database,
    });
  });

  // Public runtime configuration. UI copy for the fee and tier labels comes
  // from here; neither value is hard-coded in the web app.
  app.get('/api/config', (_req, res) => {
    res.json(demoConfig());
  });

  app.use('/api', buildRouter(db));

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
