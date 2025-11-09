#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import { v4 as uuidv4 } from "uuid";
import { insertJob, listJobs, getJob, stats } from "./jobRepository.js";
import type { Job } from "./models.js";
import { startWorkers, stopAll } from "./workerManager.js";
import db from "./db.js";

const program = new Command();
program.name("queuectl").description("CLI-based background job queue").version("1.0.0");

program
  .command("enqueue")
  .argument("<cmd>", "command to execute or job JSON")
  .option("--max-retries <n>", "max retries", "3")
  .action((cmd, opts) => {
    let command = cmd;
    let id = uuidv4();
    try {
      const parsed = JSON.parse(cmd);
      command = parsed.command;
      id = parsed.id || id;
    } catch {}
    const now = new Date().toISOString();
    const job: Job = {
      id,
      command,
      state: "pending",
      attempts: 0,
      max_retries: Number(opts.maxRetries || 3),
      created_at: now,
      updated_at: now,
      run_after: 0,
      last_error: null,
    };
    insertJob(job);
    console.log(chalk.green(`Enqueued job ${id}`));
  });

program
  .command("worker")
  .option("--count <n>", "number of workers", "1")
  .option("--poll <ms>", "poll interval ms", "1000")
  .option("--base <n>", "backoff base", "2")
  .action(async (opts) => {
    const count = Number(opts.count);
    const poll = Number(opts.poll);
    const base = Number(opts.base);

    process.on("SIGINT", () => {
      console.log(chalk.yellow("Stopping workers..."));
      stopAll();
      setTimeout(() => process.exit(0), 1000);
    });

    await startWorkers(count, poll, base);
  });

program
  .command("list")
  .option("--state <state>", "filter by state")
  .action((opts) => {
    const rows = listJobs(opts.state);
    console.table(rows.map((r) => ({ id: r.id, state: r.state, attempts: r.attempts, cmd: r.command })));
  });

program
  .command("status")
  .action(() => {
    console.table(stats());
  });

program
  .command("dlq")
  .option("--list", "list DLQ")
  .option("--retry <id>", "retry job by ID")
  .action((opts) => {
    if (opts.list) {
      const rows = listJobs("dead");
      console.table(rows.map((r) => ({ id: r.id, cmd: r.command, last_error: r.last_error })));
      return;
    }
    if (opts.retry) {
      const job = getJob(opts.retry);
      if (!job) return console.log("Job not found");
      db.prepare(`UPDATE jobs SET state='pending', attempts=0, last_error=NULL WHERE id=?`).run(job.id);
      console.log("Requeued", opts.retry);
    }
  });

program.parse(process.argv);
