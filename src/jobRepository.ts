import db from "./db.js";
import type { Job } from "./models.js";

export const insertJob = (job: Job) => {
  const stmt = db.prepare(`
    INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at, run_after, last_error)
    VALUES (@id, @command, @state, @attempts, @max_retries, @created_at, @updated_at, @run_after, @last_error)
  `);
  stmt.run(job);
};

export const getPendingJob = (): Job | null => {
  const now = Math.floor(Date.now() / 1000);
  const job = db
    .prepare(
      `SELECT * FROM jobs WHERE state = 'pending' AND run_after <= ? ORDER BY created_at LIMIT 1`
    )
    .get(now) as Job | undefined;
  if (!job) return null;
  db.prepare(`UPDATE jobs SET state='processing', updated_at=? WHERE id=?`).run(
    new Date().toISOString(),
    job.id
  );
  return job;
};

export const updateJob = (id: string, fields: Partial<Job>) => {
  const columns: string[] = [];
  const params: Record<string, any> = { id };
  for (const [k, v] of Object.entries(fields)) {
    columns.push(`${k}=@${k}`);
    params[k] = v;
  }
  if (!columns.length) return;
  db.prepare(`UPDATE jobs SET ${columns.join(", ")} WHERE id=@id`).run(params);
};

export const listJobs = (state?: string): Job[] => {
  if (state)
    return db
      .prepare(`SELECT * FROM jobs WHERE state = ? ORDER BY created_at DESC`)
      .all(state) as Job[];
  return db.prepare(`SELECT * FROM jobs ORDER BY created_at DESC`).all() as Job[];
};

export const getJob = (id: string): Job | null => {
  return db.prepare(`SELECT * FROM jobs WHERE id=?`).get(id) as Job | null;
};

export const stats = () => {
  const rows = db.prepare(`SELECT state, COUNT(*) AS cnt FROM jobs GROUP BY state`).all();
  const result: Record<string, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dead: 0,
  };
  rows.forEach((r: any) => (result[r.state] = r.cnt));
  return result;
};
