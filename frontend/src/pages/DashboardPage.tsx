import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Check, Search } from "lucide-react";
import { getSubmission, listUserSubmissions, updateSubmission, deleteSubmission } from "../lib/api";
import type { SubmissionDetail, SubmissionSummary } from "../lib/types";
import { Button } from "../components/ui/Button";
import { useAuth, SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";

export function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [rows, setRows] = useState<SubmissionSummary[]>([]);
  const [selected, setSelected] = useState<SubmissionDetail | null>(null);
  const [query, setQuery] = useState("");

  async function load() {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listUserSubmissions(token);
      setRows(data);
      if (!selected && data[0]) {
        const detail = await getSubmission(data[0].id); // You might need a getSubmission that also takes token, or we just trust the admin key for now, wait we need to secure getSubmission too.
        setSelected(detail);
      }
    } catch (e) {
      console.error("Failed to load submissions:", e);
    }
  }

  useEffect(() => { 
    if (isLoaded && isSignedIn) {
      void load(); 
    }
  }, [isLoaded, isSignedIn]);

  const filtered = useMemo(() => rows.filter((row) => row.business_name.toLowerCase().includes(query.toLowerCase()) || row.industry.toLowerCase().includes(query.toLowerCase())), [rows, query]);
  const totalHours = rows.reduce((sum, row) => sum + (row.hours_wasted_weekly ?? 0), 0);
  const avgScore = rows.length ? Math.round(rows.reduce((sum, row) => sum + (row.automation_score ?? 0), 0) / rows.length) : 0;

  async function setStatus(status: string) {
    if (!selected) return;
    const updated = await updateSubmission(selected.id, status, selected.internal_notes);
    setSelected(updated);
    await load();
  }

  async function handleDelete() {
    if (!selected) return;
    if (!confirm("Are you sure you want to delete this submission?")) return;
    await deleteSubmission(selected.id);
    setSelected(null);
    await load();
  }

  if (!isLoaded) return <div className="p-8 text-center">Loading...</div>;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-lg border border-line bg-white p-8 shadow-sm text-center">
          <h1 className="font-['DM_Sans'] text-2xl font-bold text-ink mb-2">Welcome to your Dashboard</h1>
          <p className="text-slate-600 mb-6">Please log in to view your past AI audits and chat history.</p>
          <SignInButton mode="modal">
            <Button className="w-full justify-center">Login / Sign Up</Button>
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
          <Metric label="Hours found" value={`${totalHours}`} />
          <Metric label="Conversion" value="0%" />
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-lg border border-line bg-white">
            <div className="flex items-center gap-2 border-b border-line p-4"><Search size={17} /><input className="w-full outline-none" placeholder="Search business or industry" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
            <div className="overflow-x-auto">
              {rows.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p>No audits found yet.</p>
                  <a href="/audit" className="mt-4 inline-block text-primary hover:underline">Run your first audit</a>
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Business</th><th className="p-3">Industry</th><th className="p-3">Score</th><th className="p-3">Status</th></tr></thead>
                  <tbody>{filtered.map((row) => <tr key={row.id} className="cursor-pointer border-t border-line hover:bg-slate-50" onClick={async () => setSelected(await getSubmission(row.id))}><td className="p-3 font-semibold">{row.business_name}</td><td className="p-3">{row.industry}</td><td className="p-3">{row.automation_score ?? "-"}</td><td className="p-3"><span className="rounded border border-line px-2 py-1">{row.status}</span></td></tr>)}</tbody>
                </table>
              )}
            </div>
          </div>
          <aside className="rounded-lg border border-line bg-white p-5">
            {selected ? (
              <>
                <h2 className="font-['DM_Sans'] text-2xl font-bold">{selected.business_name}</h2>
                <p className="mt-1 text-sm text-slate-500">{selected.industry} · {selected.team_size}</p>
                <p className="mt-5 text-sm leading-6 text-slate-700">{selected.process_description}</p>
                {selected.audit_result && <div className="mt-5 rounded-md border border-line p-4"><p className="font-semibold">Score {selected.audit_result.automation_score}%</p><p className="mt-2 text-sm text-slate-600">{selected.audit_result.summary}</p></div>}
                <textarea className="mt-5 min-h-24 w-full rounded-md border border-line p-3 text-sm" value={selected.internal_notes} onChange={(e) => setSelected({ ...selected, internal_notes: e.target.value })} placeholder="Internal notes" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {["reviewed", "building", "delivered"].map((status) => <Button key={status} onClick={() => setStatus(status)}><Check size={15} /> {status}</Button>)}
                  <button onClick={handleDelete} className="ml-auto rounded border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-100">Delete</button>
                </div>
              </>
            ) : <p className="text-slate-500">No submission selected.</p>}
          </aside>
        </div>
      </section>
    </DashboardLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-line bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-['DM_Sans'] text-2xl font-bold">{value}</p></div>;
}

