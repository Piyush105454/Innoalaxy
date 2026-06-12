import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentLog, AuditResult } from "../lib/types";

interface AuditState {
  currentStep: number;
  auditResult: AuditResult | null;
  agentRunId: string | null;
  agentLogs: AgentLog[];
  agentOutput: string;
  loadingAudit: boolean;
  loadingAgent: boolean;
  setStep: (step: number) => void;
  setAuditResult: (result: AuditResult | null) => void;
  setAgentRunId: (id: string | null) => void;
  setAgentLogs: (logs: AgentLog[]) => void;
  setAgentOutput: (output: string) => void;
  setLoadingAudit: (loading: boolean) => void;
  setLoadingAgent: (loading: boolean) => void;
  reset: () => void;
}

export const useAuditStore = create<AuditState>()(
  persist(
    (set) => ({
      currentStep: 1,
      auditResult: null,
      agentRunId: null,
      agentLogs: [],
      agentOutput: "",
      loadingAudit: false,
      loadingAgent: false,
      setStep: (currentStep) => set({ currentStep }),
      setAuditResult: (auditResult) => set({ auditResult }),
      setAgentRunId: (agentRunId) => set({ agentRunId }),
      setAgentLogs: (agentLogs) => set({ agentLogs }),
      setAgentOutput: (agentOutput) => set({ agentOutput }),
      setLoadingAudit: (loadingAudit) => set({ loadingAudit }),
      setLoadingAgent: (loadingAgent) => set({ loadingAgent }),
      reset: () => set({ currentStep: 1, auditResult: null, agentRunId: null, agentLogs: [], agentOutput: "", loadingAudit: false, loadingAgent: false })
    }),
    {
      name: 'audit-storage',
    }
  )
);

