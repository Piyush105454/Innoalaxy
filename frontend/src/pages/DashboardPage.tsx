import { useEffect, useMemo, useState, useRef } from "react";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Check, Search, Download, X, Zap } from "lucide-react";
import { getSubmission, listUserSubmissions, updateSubmission, deleteSubmission } from "../lib/api";
import type { SubmissionDetail, SubmissionSummary } from "../lib/types";
import { Button } from "../components/ui/Button";
import { useAuth, SignInButton, SignedIn, SignedOut } from "@clerk/clerk-react";
import html2pdf from "html2pdf.js";

export function DashboardPage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [rows, setRows] = useState<SubmissionSummary[]>([]);
  const [selected, setSelected] = useState<SubmissionDetail | null>(null);
  const [query, setQuery] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  async function load() {
    if (!isSignedIn) return;
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listUserSubmissions(token);
      setRows(data);
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

  const handleDownloadPdf = async () => {
    if (!printRef.current) return;
    const element = printRef.current;
    const opt = {
      margin: 0.5,
      filename: `${selected?.business_name || 'Innoalaxy'}_Audit_Plan.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  if (!isLoaded) return <div className="p-8 text-center">Loading...</div>;

  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-lg border border-line bg-white p-8 shadow-sm text-center">
          <h1 className="font-['DM_Sans'] text-2xl font-bold text-ink mb-2">Welcome to your Dashboard</h1>
          <p className="text-slate-600 mb-6">Please log in to view your past AI audits and chat history.</p>
          <SignInButton mode="modal" forceRedirectUrl="/dashboard">
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
                    <th className="p-4 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="cursor-pointer border-t border-line hover:bg-slate-50 transition-colors" onClick={async () => setSelected(await getSubmission(row.id))}>
                      <td className="p-4 font-bold text-ink">{row.business_name}</td>
                      <td className="p-4 text-slate-600">{row.industry}</td>
                      <td className="p-4 font-semibold text-primary">{row.automation_score ?? "-"}%</td>
                      <td className="p-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${row.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>

      {/* Full Screen Modal View for Selected Submission */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 sm:p-6 md:p-12 backdrop-blur-sm">
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line bg-white px-6 py-4">
              <h2 className="font-['DM_Sans'] text-2xl font-bold text-ink truncate mr-4">AI Audit Plan: {selected.business_name}</h2>
              <div className="flex gap-3">
                <Button onClick={handleDownloadPdf} className="bg-slate-800 text-white hover:bg-slate-900">
                  <Download size={16} className="mr-2" /> Export PDF
                </Button>
                <button onClick={() => setSelected(null)} className="rounded-full p-2 hover:bg-slate-100 text-slate-500 transition-colors">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Scrollable Content (This part gets printed to PDF) */}
            <div className="flex-1 overflow-y-auto bg-slate-50/50">
              <div ref={printRef} className="p-8 space-y-8 bg-white m-0 sm:m-4 rounded-xl border border-line">
                  
                  {/* Print Header */}
                  <div className="flex justify-between items-start border-b border-line pb-6">
                      <div>
                          <h1 className="text-4xl font-bold text-ink font-['DM_Sans'] mb-2">{selected.business_name}</h1>
                          <p className="text-slate-500 font-medium">{selected.industry} &nbsp;&bull;&nbsp; {selected.team_size}</p>
                      </div>
                      {selected.audit_result && (
                          <div className="text-right bg-primary/5 px-6 py-3 rounded-xl border border-primary/10">
                              <div className="text-5xl font-extrabold text-primary">{selected.audit_result.automation_score}%</div>
                              <div className="text-sm text-primary font-bold tracking-wide uppercase mt-1">Automation Score</div>
                          </div>
                      )}
                  </div>

                  {/* Process Analyzed */}
                  <div>
                      <h3 className="font-semibold text-lg text-slate-800 mb-2 flex items-center gap-2"><Check size={18} className="text-primary"/> Current Process</h3>
                      <p className="text-slate-600 whitespace-pre-wrap leading-relaxed bg-slate-50 p-4 rounded-lg border border-line">{selected.process_description}</p>
                  </div>

                  {/* AI Summary */}
                  {selected.audit_result && (
                    <>
                      <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
                          <h3 className="font-semibold text-lg mb-3 text-emerald-800 flex items-center gap-2"><Search size={18}/> Innoalaxy AI Analysis</h3>
                          <p className="text-emerald-900 leading-relaxed font-medium">{selected.audit_result.summary}</p>
                          <p className="text-sm mt-4 text-emerald-700/80 italic">{selected.audit_result.industry_context}</p>
                      </div>

                      {/* Blueprint Timeline */}
                      {selected.audit_result.blueprint && (
                          <div className="mt-8">
                              <h3 className="font-bold text-2xl text-ink font-['DM_Sans'] mb-6">Optimized Blueprint & Tooling</h3>
                              <div className="grid gap-4">
                                  {selected.audit_result.blueprint.steps.map((step, idx) => (
                                      <div key={idx} className="flex gap-5 p-5 rounded-xl border border-slate-200 bg-white shadow-sm">
                                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-lg border border-primary/20">{idx + 1}</div>
                                          <div>
                                              <h4 className="font-bold text-lg text-ink">{step.title}</h4>
                                              <p className="text-slate-600 mt-2 leading-relaxed">{step.description}</p>
                                              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700 border border-slate-200">
                                                  <Zap size={14} className="text-amber-500" />
                                                  Tool: {step.tool}
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {/* ROI Metrics */}
                      <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-line">
                          <div className="rounded-xl p-6 bg-blue-50 border border-blue-100 text-center">
                              <div className="text-sm font-bold text-blue-600 uppercase tracking-wide">Hours Saved Weekly</div>
                              <div className="text-4xl font-extrabold text-blue-900 mt-2">{selected.audit_result.blueprint?.hours_saved_weekly || selected.audit_result.hours_wasted_weekly}</div>
                          </div>
                          <div className="rounded-xl p-6 bg-purple-50 border border-purple-100 text-center">
                              <div className="text-sm font-bold text-purple-600 uppercase tracking-wide">Estimated Value / Cost</div>
                              <div className="text-3xl font-extrabold text-purple-900 mt-2">{selected.audit_result.blueprint?.price_range || "TBD"}</div>
                          </div>
                      </div>
                    </>
                  )}
              </div>
            </div>

            {/* Admin Controls (Not Printed) */}
            <div className="bg-slate-100 p-6 border-t border-line shadow-inner">
                <textarea className="w-full min-h-24 rounded-xl border border-line p-4 text-sm focus:outline-primary focus:ring-2 focus:ring-primary/20 shadow-sm" value={selected.internal_notes || ""} onChange={(e) => setSelected({ ...selected, internal_notes: e.target.value })} placeholder="Add internal admin notes here..." />
                
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wide mr-2">Status:</span>
                    {["reviewed", "building", "delivered"].map((status) => (
                      <Button 
                        key={status} 
                        onClick={() => setStatus(status)} 
                        className={`capitalize ${selected.status === status ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-white text-slate-600 hover:bg-slate-50 border-slate-300"}`} 
                      >
                        {selected.status === status && <Check size={14} className="mr-1.5" />} {status}
                      </Button>
                    ))}
                  </div>
                  <button onClick={handleDelete} className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-100 transition-colors">
                    Delete Submission
                  </button>
                </div>
            </div>

          </div>
        </div>
      )}
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
