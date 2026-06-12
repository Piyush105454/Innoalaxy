export type Priority = "high" | "medium" | "low";
export type AgentStatusValue = "queued" | "running" | "completed" | "failed";

export interface PainPoint {
  title: string;
  description: string;
  time_wasted_hours: number;
  automation_type: string;
  priority: Priority;
  complexity: "simple" | "medium" | "complex";
}

export interface BlueprintStep {
  title: string;
  description: string;
  tool: string;
}

export interface BlueprintResult {
  steps: BlueprintStep[];
  integrations: string[];
  build_time_weeks: number;
  hours_saved_weekly: number;
  price_range: string;
  score_breakdown?: Record<string, number>;
}

export interface AuditResult {
  submission_id: string;
  automation_score: number;
  hours_wasted_weekly: number;
  automatable_percentage: number;
  pain_points: PainPoint[];
  blueprint: BlueprintResult;
  summary: string;
  industry_context: string;
}

export interface AgentLog {
  timestamp: string;
  level: string;
  message: string;
}

export interface AgentStatus {
  run_id: string;
  submission_id: string;
  agent_type: string;
  status: AgentStatusValue;
  logs: AgentLog[];
  output: string;
}

export interface SubmissionSummary {
  id: string;
  business_name: string;
  industry: string;
  team_size: string;
  status: string;
  email?: string;
  automation_score: number | null;
  hours_wasted_weekly: number | null;
  created_at: string;
}

export interface SubmissionDetail extends SubmissionSummary {
  process_description: string;
  internal_notes: string;
  audit_result: AuditResult | null;
  agent_runs: AgentStatus[];
}

