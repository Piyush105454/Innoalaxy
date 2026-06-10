import type { AgentStatus, AuditResult, SubmissionDetail, SubmissionSummary } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.DEV ? "http://localhost:8000" : "https://innoalaxy-13277279334.asia-south2.run.app");
const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY ?? "change-me";

async function request<T>(path: string, options: RequestInit = {}, timeoutMs = 25000): Promise<T> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(new Error("The AI is taking longer than expected to respond. Please try again.")), timeoutMs);
  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(json.detail ?? json.message ?? `Request failed: ${res.status}`);
    }
    return json.data as T;
  } finally {
    window.clearTimeout(id);
  }
}

export function analyzeProcess(formData: FormData): Promise<AuditResult> {
  // Give the LLM up to 120 seconds to do the deep business audit
  return request<AuditResult>("/audit/analyze", { method: "POST", body: formData }, 120000);
}

export function getAuditResult(submissionId: string): Promise<AuditResult> {
  return request<AuditResult>(`/audit/${submissionId}`);
}

export function runAgentDemo(submissionId: string): Promise<{ run_id: string }> {
  return request<{ run_id: string }>("/agent/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ submission_id: submissionId, agent_type: "business_optimization", demo_mode: true })
  });
}

export function getAgentStatus(runId: string): Promise<AgentStatus> {
  return request<AgentStatus>(`/agent/${runId}/status`);
}

export function getAgentOutput(runId: string): Promise<{ output: string; status: string }> {
  return request<{ output: string; status: string }>(`/agent/${runId}/output`);
}

export function listSubmissions(): Promise<SubmissionSummary[]> {
  return request<SubmissionSummary[]>("/submissions", { headers: { "X-Admin-Key": ADMIN_KEY } });
}

export function getSubmission(id: string): Promise<SubmissionDetail> {
  return request<SubmissionDetail>(`/submissions/${id}`, { headers: { "X-Admin-Key": ADMIN_KEY } });
}

export function updateSubmission(id: string, status: string, notes?: string): Promise<SubmissionDetail> {
  return request<SubmissionDetail>(`/submissions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "X-Admin-Key": ADMIN_KEY },
    body: JSON.stringify({ status, notes })
  });
}

export function deleteSubmission(id: string): Promise<void> {
  return request<void>(`/submissions/${id}`, {
    method: "DELETE",
    headers: { "X-Admin-Key": ADMIN_KEY }
  });
}
