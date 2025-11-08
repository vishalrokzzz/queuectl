import Database from "better-sqlite3";
import type { Database as BetterSQLite3Database } from "better-sqlite3";
import * as path from "node:path";

const DB_PATH = path.resolve(process.cwd(), "queuectl.db");
const db: BetterSQLite3Database = new Database(DB_PATH);

db.exec(`
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  state TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  run_after INTEGER DEFAULT 0,
  last_error TEXT DEFAULT NULL
);
CREATE INDEX IF NOT EXISTS idx_state ON jobs(state);
CREATE INDEX IF NOT EXISTS idx_run_after ON jobs(run_after);
`);

export default db;
