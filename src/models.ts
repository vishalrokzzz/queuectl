export type JobState = "pending" | "processing" | "completed" | "failed" | "dead";

export interface Job {
  id: string;
  command: string;
  state: JobState;
  attempts: number;
  max_retries: number;
  created_at: string;
  updated_at: string;
  run_after: number;
  last_error?: string | null;
}
