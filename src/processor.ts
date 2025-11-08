import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Job } from "./models.js";
import { updateJob } from "./jobRepository.js";
import { computeBackoffRunAfter } from "./utils.js";

const execP = promisify(exec);

export const processJob = async (job: Job, backoffBase = 2) => {
  try {
    await execP(job.command, { timeout: 1000 * 60 * 5 });
    updateJob(job.id, { state: "completed", updated_at: new Date().toISOString() });
    return { success: true };
  } catch (err: any) {
    const attempts = job.attempts + 1;
    if (attempts > job.max_retries) {
      updateJob(job.id, {
        state: "dead",
        attempts,
        updated_at: new Date().toISOString(),
        last_error: err.message || String(err),
      });
      return { success: false, dead: true };
    } else {
      const run_after = computeBackoffRunAfter(backoffBase, attempts);
      updateJob(job.id, {
        state: "pending",
        attempts,
        run_after,
        updated_at: new Date().toISOString(),
        last_error: err.message || String(err),
      });
      return { success: false, dead: false };
    }
  }
};
