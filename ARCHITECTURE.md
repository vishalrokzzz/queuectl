

## 🧱 **ARCHITECTURE.md**

```markdown
# 🧱 QueueCTL — Architecture Overview

This document explains the **architecture, data flow, and design decisions** behind **QueueCTL**, a CLI-based background job queue system built using **TypeScript**, **Node.js**, and **SQLite**.

---

## 🧠 System Overview

**QueueCTL** is a minimal yet production-style background job system inspired by message queue architectures (like Sidekiq or Celery).  
It allows shell commands to be executed asynchronously, retried automatically on failure, and tracked persistently across restarts.

Each job passes through well-defined states managed by a SQLite-backed queue and is processed by worker threads.

---

## ⚙️ Core Components

| Component | Responsibility |
|------------|----------------|
| **CLI (cli.ts)** | Entry point for user commands (`enqueue`, `worker`, `status`, `dlq`, etc.) |
| **Database (db.ts)** | Handles persistent SQLite connection |
| **Job Model (models.ts)** | Defines job schema and structure |
| **Job Repository (jobRepository.ts)** | CRUD operations on jobs (insert, update, fetch, etc.) |
| **Processor (processor.ts)** | Executes commands, applies retry/backoff logic |
| **Worker Manager (workerManager.ts)** | Spawns and supervises worker threads for parallel execution |
| **Utils (utils.ts)** | Helper functions (timestamps, delay, logging) |

---

## 🔄 Job Lifecycle

| State | Description |
|--------|-------------|
| `pending` | Waiting to be picked up by a worker |
| `processing` | Currently executing |
| `completed` | Successfully executed |
| `failed` | Failed but will retry |
| `dead` | Permanently failed after max retries (moved to DLQ) |

---

### 🧩 Typical Job Flow

1. **Enqueue**
   - The user runs:  
     ```
     node dist/cli.js enqueue "echo hello"
     ```
   - CLI creates a new job in the `pending` state and stores it in SQLite.

2. **Worker Startup**
   - The user runs:  
     ```
     node dist/cli.js worker --count 2
     ```
   - Two workers start polling for pending jobs.

3. **Job Execution**
   - Worker fetches the next pending job.
   - State changes to `processing`.
   - The shell command executes using Node’s `child_process.exec`.

4. **Success**
   - Exit code `0` → mark job as `completed`.

5. **Failure**
   - Non-zero exit code → increment attempt count.
   - Apply **exponential backoff** before retrying:
     ```
     delay = base ^ attempts
     ```
     Example: base=2 → attempts=1,2,3 → delays=2s,4s,8s.

6. **DLQ (Dead Letter Queue)**
   - After `max_retries`, job moves to `dead`.
   - Can later be inspected or retried manually:
     ```
     node dist/cli.js dlq --list
     node dist/cli.js dlq --retry <id>
     ```

---

## 📊 Data Flow Diagram

````

```
       +------------------+
       |   CLI Commands   |
       |------------------|
       | enqueue / worker |
       +--------+---------+
                |
                v
       +------------------+
       |  Job Repository  |
       |------------------|
       | Insert / Fetch   |
       | Update States    |
       +--------+---------+
                |
                v
       +------------------+
       |     SQLite DB    |
       |------------------|
       | pending jobs     |
       | job states, logs |
       +--------+---------+
                |
       +--------v---------+
       |   Worker Manager |
       |------------------|
       | Spawn Workers    |
       | Fetch Jobs       |
       +--------+---------+
                |
                v
       +------------------+
       |   Processor      |
       |------------------|
       | Execute Commands |
       | Handle Failures  |
       | Retry / DLQ      |
       +------------------+
```

```

---

## ⚡ Retry & Exponential Backoff

When a job fails, QueueCTL waits for an exponentially increasing delay before retrying:

```

delay = base ^ attempts

```

- **Example**: base = 2, attempts = 3  
  → delay = 2³ = 8 seconds  
- **Purpose:** Prevents overloading the system with repeated failures.  
- **After max retries:** The job is moved to the Dead Letter Queue.

---

## 🧩 Global State Consistency

All job transitions are atomic and persisted in SQLite.  
This ensures:
- No job is lost even if the process restarts.  
- No two workers can process the same job simultaneously.  
- Every state transition (`pending → processing → completed/failed/dead`) is committed in one transaction.

---

## 👥 Concurrency Model

- Multiple workers can run in parallel.
- Each worker locks a job by marking it `processing`.
- Once a job completes or fails, its state is updated before fetching the next one.
- On graceful shutdown, all workers finish their current job before exiting.

---

## 🧰 Undo/Redo Strategy

**Global Undo/Redo** in this CLI context is modeled as:
- **Redo:** Re-enqueue a job (from DLQ or failed state)  
  → CLI reuses the same job command and creates a new pending job.  
- **Undo:** Not directly applicable (since jobs are persisted once executed),  
  but failed jobs can be safely retried without data corruption.

---

## 🧠 Performance Optimizations

| Optimization | Description |
|---------------|-------------|
| **SQLite Persistence** | Ensures lightweight local durability without complex setup |
| **Batch Fetching** | Workers fetch one job at a time to avoid race conditions |
| **Backoff-based Retrying** | Reduces CPU/network load from repeated failures |
| **Child Process Isolation** | Each command runs independently, avoiding memory leaks |
| **Graceful Worker Stop** | Prevents incomplete job execution on shutdown |

---

## 🧩 Error Handling & Fault Tolerance

- Invalid commands (`ls invalid_dir`) → Marked failed → Retried → Sent to DLQ  
- Graceful shutdown ensures in-progress jobs finish safely  
- Persistent SQLite storage prevents job loss even after app crash or restart

---

## 🧠 Design Decisions

| Decision | Rationale |
|-----------|------------|
| **SQLite over Redis** | Easy setup, persistent local storage, zero dependencies |
| **better-sqlite3** | Synchronous, lightweight, no connection pool complexity |
| **Commander.js** | Simple and expressive CLI argument parsing |
| **TypeScript** | Type safety + clearer module organization |
| **Modular separation** | Each file handles a single responsibility |

---

## 🧩 Future Enhancements

| Feature | Description |
|----------|--------------|
| Job priorities | Allow high-priority jobs to run before others |
| Scheduled jobs | Support `run_at` timestamp for delayed execution |
| Web dashboard | Visual interface for monitoring queue state |
| Job timeouts | Automatically stop long-running jobs |
| Metrics | Add processing time, failure rate tracking |
| Persistent configuration | Manage retry policy from CLI config |

---

## 🏁 Summary

QueueCTL combines **TypeScript clarity**, **SQLite persistence**, and **CLI simplicity** to provide a reliable background job processing framework.  
It demonstrates core distributed system principles — **asynchronous execution**, **fault tolerance**, and **state management** — in a lightweight, developer-friendly package.

---

**Author:** [Vishal Dasari](mailto:dasarivishal.prof@gmail.com)  
**GitHub:** [vishalrokzzz](https://github.com/vishalrokzzz)  
**Project:** [QueueCTL](https://github.com/vishalrokzzz/queuectl)
```

