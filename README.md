

## 📘 **README.md**

````markdown
# 🚀 QueueCTL — CLI-Based Background Job Queue System

A lightweight, production-style **background job queue system** built with **TypeScript + SQLite**.  
`queuectl` lets you enqueue shell commands as background jobs, process them asynchronously using worker processes, handle retries with exponential backoff, and move permanently failed jobs to a **Dead Letter Queue (DLQ)**.

---

## 🧠 Overview

QueueCTL provides a simple CLI to manage background jobs efficiently.  
Each job runs as a separate process, retried on failure, and persisted using SQLite for durability.

### 🎯 Core Features

✅ **Enqueue Jobs** — Add new shell commands to execute asynchronously  
✅ **Multiple Workers** — Process jobs concurrently  
✅ **Retries with Exponential Backoff** — Automatic retry for transient failures  
✅ **Dead Letter Queue (DLQ)** — Stores permanently failed jobs  
✅ **Persistent Storage** — SQLite ensures jobs survive restarts  
✅ **Graceful Shutdown** — Workers finish current jobs before stopping  
✅ **CLI Management** — Manage jobs, DLQ, and worker processes from terminal  

---

## 🧩 Example Usage

### 1️⃣ Enqueue Jobs
```bash
node dist/cli.js enqueue "echo hello"
node dist/cli.js enqueue "ls invalid_dir"
````

### 2️⃣ Start Workers

```bash
node dist/cli.js worker --count 2
```

Output:

```
[Worker-1] processing (echo hello)
[Worker-2] processing (ls invalid_dir)
[Worker-1] done
[Worker-2] retry scheduled
[Worker-2] dead
```

### 3️⃣ Check Status

```bash
node dist/cli.js status
```

```
┌────────────┬────────┐
│ completed  │ 1      │
│ dead       │ 1      │
└────────────┴────────┘
```

### 4️⃣ List and Retry Dead Jobs

```bash
node dist/cli.js dlq --list
node dist/cli.js dlq --retry <job_id>
```

---

## ⚙️ Installation

```bash
git clone https://github.com/vishalrokzzz/queuectl.git
cd queuectl
npm install
npm run build
```

---

## 🧰 Development

Run in development mode with auto-reload:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Run CLI:

```bash
node dist/cli.js --help
```

---

## 🗃️ Project Structure

```
queuectl/
├── src/
│   ├── cli.ts              # CLI commands
│   ├── db.ts               # SQLite connection
│   ├── models.ts           # Job model definition
│   ├── jobRepository.ts    # DB operations for jobs
│   ├── processor.ts        # Job execution + retry
│   ├── workerManager.ts    # Worker pool manager
│   └── utils.ts            # Helper functions
├── package.json
├── tsconfig.json
├── README.md
└── queuectl.db             # Persistent job data
```

---

## ⚡ Commands Reference

| Command                         | Description                |
| ------------------------------- | -------------------------- |
| `queuectl enqueue <cmd>`        | Add a new job to the queue |
| `queuectl worker --count <n>`   | Start N workers            |
| `queuectl list --state <state>` | List jobs by status        |
| `queuectl status`               | View overall queue stats   |
| `queuectl dlq --list`           | Show jobs in DLQ           |
| `queuectl dlq --retry <id>`     | Requeue DLQ job            |

---

## 💾 Persistence

Jobs are stored in a local SQLite database (`queuectl.db`), ensuring data survives restarts.

| Job State    | Description                       |
| ------------ | --------------------------------- |
| `pending`    | Waiting for a worker              |
| `processing` | Currently being executed          |
| `completed`  | Finished successfully             |
| `failed`     | Failed but retryable              |
| `dead`       | Permanently failed (moved to DLQ) |

---

## 🧮 Retry & Backoff Formula

Each failed job waits exponentially longer before retrying:

```
delay = base ^ attempts
```

Example:
Base = 2, Attempts = 3 → Delay = 8 seconds

---

## 🧱 Tech Stack

* **Language:** TypeScript
* **Runtime:** Node.js
* **Database:** SQLite (via `better-sqlite3`)
* **CLI Framework:** Commander.js
* **Utilities:** Chalk for colors, UUID for unique job IDs

---

## 📦 Scripts

| Script          | Description                      |
| --------------- | -------------------------------- |
| `npm run dev`   | Run in development (ts-node-dev) |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start`     | Run from built files (`dist/`)   |

---

## 🧾 Example Output

```
[Worker-1] started
[Worker-2] started
[Worker-1] processing echo hello
[Worker-1] done
[Worker-2] processing ls invalid_dir
[Worker-2] retry scheduled
[Worker-2] dead
Stopping workers...
```

---

## 🧠 Architecture Summary

QueueCTL is built around:

1. **Persistent Queue (SQLite)** — Jobs are stored with states.
2. **Worker Pool** — Executes jobs concurrently.
3. **Retry Engine** — Implements exponential backoff for transient failures.
4. **Dead Letter Queue** — Captures permanently failed jobs for review.

For detailed design and data flow diagrams, see [`ARCHITECTURE.md`](ARCHITECTURE.md).

---

## 🧑‍💻 Author

**Vishal Dasari**
📧 [dasarivishal.prof@gmail.com](mailto:dasarivishal.prof@gmail.com)
🌐 [GitHub: vishalrokzzz](https://github.com/vishalrokzzz)

---

## 🏁 Status

✅ Fully working CLI-based background job queue
✅ Tested with multiple workers and real commands
✅ Ready for submission (Flamapp.ai Internship Assignment)

````

