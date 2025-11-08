import chalk from "chalk";
import { getPendingJob } from "./jobRepository.js";
import { processJob } from "./processor.js";
import { sleep } from "./utils.js";

let active = true;

export const stopAll = () => {
  active = false;
};

export const workerLoop = async (id: number, poll = 1000, base = 2) => {
  console.log(chalk.green(`[Worker-${id}] started`));
  while (active) {
    const job = getPendingJob();
    if (!job) {
      await sleep(poll);
      continue;
    }
    console.log(chalk.cyan(`[Worker-${id}] processing ${job.id} (${job.command})`));
    const res = await processJob(job, base);
    if (res.success) console.log(chalk.green(`[Worker-${id}] ${job.id} done`));
    else if (res.dead) console.log(chalk.red(`[Worker-${id}] ${job.id} dead`));
    else console.log(chalk.yellow(`[Worker-${id}] ${job.id} retry scheduled`));
  }
  console.log(chalk.gray(`[Worker-${id}] stopped`));
};

export const startWorkers = async (count = 1, poll = 1000, base = 2) => {
  for (let i = 1; i <= count; i++) workerLoop(i, poll, base);
};
