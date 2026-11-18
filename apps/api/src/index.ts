import { createApp } from './app.js';
import { config } from './config.js';
import { migrate, openDb } from './db/index.js';

const db = openDb();
migrate(db);

const app = createApp(db);

app.listen(config.port, () => {
  console.log(`LMNS API listening on http://localhost:${config.port} (db: ${config.dbPath})`);
});
