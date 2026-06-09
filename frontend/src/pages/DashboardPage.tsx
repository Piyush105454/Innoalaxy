import { useEffect, useMemo, useState } from "react";
import { Check, Search } from "lucide-react";
import { getSubmission, listSubmissions, updateSubmission, deleteSubmission } from "../lib/api";
import type { SubmissionDetail, SubmissionSummary } from "../lib/types";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const [rows, setRows] = useState<SubmissionSummary[]>([]);
  const [selected, setSelected] = useState<SubmissionDetail | null>(null);
  const [query, setQuery] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");

  async function load() {
    const data = await listSubmissions();
    setRows(data);
    if (!selected && data[0]) setSelected(await getSubmission(data[0].id));
  }

  useEffect(() => { 
    if (isAuthenticated) {
      void load(); 
    }
  }, [isAuthenticated]);

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

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (email === "piyushmodi812@gmail.com" && password === "codepagalu") {
      setIsAuthenticated(true);
      setAuthError("");
    } else {
      setAuthError("Invalid credentials");
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm rounded-lg border border-line bg-white p-8 shadow-sm">
          <h1 className="text-center font-['DM_Sans'] text-2xl font-bold text-ink">Admin Login</h1>
          {authError && <p className="mt-4 text-center text-sm text-red-600">{authError}</p>}
          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded border border-line px-3 py-2 outline-none focus:border-slate-400" />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded border border-line px-3 py-2 outline-none focus:border-slate-400" />
            </div>
            <Button type="submit" className="w-full justify-center">Login</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-50 text-ink">
      <aside className="hidden w-64 border-r border-line bg-white p-5 md:block">
        <a href="/" className="font-['DM_Sans'] text-xl font-bold">Innoalaxy</a>
        <nav className="mt-8 space-y-2 text-sm"><a className="block rounded bg-slate-100 px-3 py-2 font-semibold" href="/dashboard">Submissions</a><a className="block px-3 py-2 text-slate-600" href="/audit">Audit flow</a></nav>
      </aside>
      <section className="flex-1 p-4 md:p-8">
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
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500"><tr><th className="p-3">Business</th><th className="p-3">Industry</th><th className="p-3">Score</th><th className="p-3">Status</th></tr></thead>
                <tbody>{filtered.map((row) => <tr key={row.id} className="cursor-pointer border-t border-line hover:bg-slate-50" onClick={async () => setSelected(await getSubmission(row.id))}><td className="p-3 font-semibold">{row.business_name}</td><td className="p-3">{row.industry}</td><td className="p-3">{row.automation_score ?? "-"}</td><td className="p-3"><span className="rounded border border-line px-2 py-1">{row.status}</span></td></tr>)}</tbody>
              </table>
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
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-line bg-white p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-['DM_Sans'] text-2xl font-bold">{value}</p></div>;
}

