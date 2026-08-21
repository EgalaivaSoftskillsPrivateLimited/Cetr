import { randomUUID } from "crypto";

export interface BulkRowResult {
  row: number;
  fullName: string;
  email: string;
  status: "success" | "error";
  certificateId?: string;
  emailSent?: boolean;
  error?: string;
}

export interface BulkIssueJob {
  id: string;
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
  status: "running" | "done";
  results: BulkRowResult[];
  createdAt: string;
  createdBy: string;
}

// Jobs are in-memory only — fine since they're transient import runs, not a
// source of truth (issued certificates themselves persist in certificateStore).
const JOB_TTL_MS = 60 * 60 * 1000; // 1 hour

const jobs = new Map<string, BulkIssueJob>();

export function createBulkIssueJob(total: number, createdBy: string): BulkIssueJob {
  const job: BulkIssueJob = {
    id: randomUUID(),
    total,
    processed: 0,
    succeeded: 0,
    failed: 0,
    status: "running",
    results: [],
    createdAt: new Date().toISOString(),
    createdBy,
  };
  jobs.set(job.id, job);
  setTimeout(() => jobs.delete(job.id), JOB_TTL_MS);
  return job;
}

export function getBulkIssueJob(id: string): BulkIssueJob | undefined {
  return jobs.get(id);
}

export function appendBulkResult(jobId: string, result: BulkRowResult): void {
  const job = jobs.get(jobId);
  if (!job) return;
  job.results.push(result);
  job.processed += 1;
  if (result.status === "success") job.succeeded += 1;
  else job.failed += 1;
  if (job.processed >= job.total) job.status = "done";
}
