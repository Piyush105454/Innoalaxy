import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Search } from "lucide-react";
import { getSubmission, listUserSubmissions } from "../lib/api";
import type { SubmissionSummary } from "../lib/types";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { useAuditStore } from "../store/auditStore";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [rows, setRows] = useState<SubmissionSummary[]>([]);
  const [query, setQuery] = useState("");
  const store = useAuditStore();

  async function load() {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listUserSubmissions(token);
      setRows(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      load();
    }
  }, [isLoaded, isSignedIn]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.business_name.toLowerCase().includes(q) || r.industry.toLowerCase().includes(q));
  }, [rows, query]);

  const avgScore = useMemo(() => {
    const withScore = rows.filter((r) => r.automation_score != null);
    if (withScore.length === 0) return 0;
    return Math.round(withScore.reduce((a, b) => a + (b.automation_score || 0), 0) / withScore.length);
  }, [rows]);

  const totalHours = useMemo(() => {
    return rows.reduce((a, b) => a + (b.hours_wasted_weekly || 0), 0);
  }, [rows]);

  const handleRowClick = async (id: string) => {
    const detail = await getSubmission(id);
    if (!detail) return;
    
    store.setAuditResult(detail.audit_result);
    
    if (detail.agent_runs && detail.agent_runs.length > 0) {
      store.setAgentOutput(detail.agent_runs[0].output);
      store.setAgentLogs(detail.agent_runs[0].logs);
      store.setAgentRunId(detail.agent_runs[0].run_id);
      store.setStep(4);
    } else {
      store.setAgentOutput("");
      store.setAgentLogs([]);
      store.setAgentRunId(null);
      store.setStep(2);
    }
    
    localStorage.setItem("audit_business_name", detail.business_name);
    window.location.href = "/audit";
  };

  if (!isLoaded) return <div className="p-8 text-center">Loading...</div>;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <h1 className="mb-4 text-2xl font-bold">Please sign in to view your dashboard</h1>
          <SignInButton mode="modal">
            <Button>Sign In</Button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout activePath="/dashboard">
      <section className="p-4 md:p-8">
        <h1 className="font-['DM_Sans'] text-3xl font-bold">Founder dashboard</h1>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <Metric label="Submissions" value={String(rows.length)} />
          <Metric label="Avg score" value={`${avgScore}%`} />
          <Metric label="Hours found" value={`${Math.round(totalHours)}`} />
          <Metric label="Conversion" value="0%" />
        </div>
        
        <div className="mt-6 rounded-lg border border-line bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-line p-4">
            <Search size={17} className="text-slate-400" />
            <input className="w-full outline-none" placeholder="Search business or industry" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="overflow-x-auto">
            {rows.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <p>No audits found yet.</p>
                <a href="/audit" className="mt-4 inline-block font-semibold text-primary hover:underline">Run your first audit</a>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-4 font-semibold">Business</th>
                    <th className="p-4 font-semibold">Industry</th>
                    <th className="p-4 font-semibold">AI Score</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="cursor-pointer border-t border-line hover:bg-slate-50 transition-colors" onClick={() => handleRowClick(row.id)}>
                      <td className="p-4 font-bold text-ink">{row.business_name}</td>
                      <td className="p-4 text-slate-600">{row.industry}</td>
                      <td className="p-4 font-semibold text-primary">{row.automation_score ?? "-"}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="mt-2 font-['DM_Sans'] text-3xl font-extrabold text-ink">{value}</p>
    </div>
  );
}
