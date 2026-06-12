import { useEffect, useState } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { ShieldAlert, Search } from "lucide-react";
import { listSubmissions, getSubmission } from "../lib/api";
import type { SubmissionSummary } from "../lib/types";
import { useUser, SignInButton, SignOutButton } from "@clerk/clerk-react";
import { useAuditStore } from "../store/auditStore";

export function AdminDashboardPage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [rows, setRows] = useState<SubmissionSummary[]>([]);
  const [query, setQuery] = useState("");
  const store = useAuditStore();
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.primaryEmailAddress?.emailAddress === "piyush.tamoli@innoalaxy.in";

  useEffect(() => {
    async function load() {
      if (!isAdmin) return;
      setLoading(true);
      try {
        const data = await listSubmissions();
        setRows(data);
      } catch (err) {
        console.error("Failed to load submissions", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isAdmin]);

  const handleRowClick = async (id: string) => {
    try {
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
    } catch (e) {
      console.error(e);
    }
  };

  if (!isLoaded) return <div className="p-8 text-center text-slate-500 font-bold">Loading...</div>;

  if (!isSignedIn) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center rounded-2xl bg-white p-12 shadow-xl border border-slate-200">
          <ShieldAlert size={48} className="mx-auto text-rose-500 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Admin Access Required</h1>
          <p className="text-slate-600 mb-8 max-w-sm">You must be logged in as the platform administrator to view this page.</p>
          <div className="inline-block bg-primary text-white rounded-xl px-8 py-3 font-bold hover:bg-primary-hover transition-colors cursor-pointer">
            <SignInButton mode="modal">Admin Login</SignInButton>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="text-center rounded-2xl bg-white p-12 shadow-xl border border-slate-200">
          <ShieldAlert size={48} className="mx-auto text-rose-500 mb-6" />
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-4 max-w-sm mx-auto">
            Your email (<span className="font-bold">{user.primaryEmailAddress?.emailAddress}</span>) is not authorized for Admin Access.
          </p>
          <div className="mt-6 inline-block bg-slate-100 text-slate-800 rounded-xl px-8 py-3 font-bold hover:bg-slate-200 transition-colors cursor-pointer">
            <SignOutButton />
          </div>
        </div>
      </div>
    );
  }

  const filtered = rows.filter(r => 
    r.business_name.toLowerCase().includes(query.toLowerCase()) || 
    r.industry.toLowerCase().includes(query.toLowerCase()) ||
    (r.email && r.email.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <DashboardLayout activePath="/admin">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-['DM_Sans'] text-4xl font-extrabold text-ink flex items-center gap-3">
            <ShieldAlert className="text-primary" /> Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Viewing all user submissions and emails.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 font-bold text-slate-700 flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
          {user.primaryEmailAddress?.emailAddress}
          <div className="ml-4 border-l border-slate-200 pl-4">
            <SignOutButton />
          </div>
        </div>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-line p-4 bg-slate-50/50">
          <Search className="text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by business, industry, or email..." 
            className="w-full bg-transparent outline-none font-medium placeholder:text-slate-400"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 font-bold flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              Loading global submissions...
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-line">
                <tr>
                  <th className="p-4 font-bold text-slate-700">Business</th>
                  <th className="p-4 font-bold text-slate-700">Industry</th>
                  <th className="p-4 font-bold text-slate-700">User Email</th>
                  <th className="p-4 font-bold text-slate-700">Date Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map(row => (
                  <tr 
                    key={row.id} 
                    onClick={() => handleRowClick(row.id)}
                    className="group cursor-pointer transition-colors hover:bg-primary/5"
                  >
                    <td className="p-4 font-bold text-ink group-hover:text-primary">{row.business_name}</td>
                    <td className="p-4 text-slate-600 font-medium">{row.industry}</td>
                    <td className="p-4 text-slate-600 font-medium">{row.email || <span className="text-slate-400 italic">No email provided</span>}</td>
                    <td className="p-4 text-slate-500 font-medium">{new Date(row.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-medium">No submissions found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
