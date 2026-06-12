import { FormEvent, useEffect, useState, useMemo, useRef } from "react";
import { useAuth, SignInButton } from "@clerk/clerk-react";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, CheckCircle, FileText, Play, RotateCcw, Upload, Search, Zap } from "lucide-react";
import { analyzeProcess, getAgentStatus, runAgentDemo } from "../lib/api";
import { useAuditStore } from "../store/auditStore";
import { Navbar } from "../components/layout/Navbar";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Button } from "../components/ui/Button";
import { DeepResearchTree } from "../components/DeepResearchTree";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import html2pdf from "html2pdf.js";

const industries = ["B2B Manufacturing", "SaaS", "HR & Recruitment", "Real Estate", "Logistics", "Healthcare", "Education", "Retail", "Finance", "Professional Services"];
const teamSizes = ["1-5", "6-15", "16-50", "51-200", "200+"];
const loadingLines = ["Reading workflow context", "Mapping manual handoffs", "Estimating hours wasted", "Drafting automation blueprint"];

export function AuditPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const store = useAuditStore();

  const [businessName, setBusinessName] = useState(() => localStorage.getItem("audit_business_name") || "");
  const [industry, setIndustry] = useState(industries[0]);
  const [teamSize, setTeamSize] = useState(teamSizes[1]);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [limitReached, setLimitReached] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPdf = () => {
    if (!printRef.current) return;
    const element = printRef.current;
    const opt = {
      margin: 0.5,
      filename: `${businessName || 'Innoalaxy'}_AI_Blueprint.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };
    html2pdf().set(opt).from(element).save();
  };

  useEffect(() => {
    if (!isSignedIn) {
      const count = parseInt(localStorage.getItem("free_audit_count") || "0", 10);
      if (count >= 2) {
        setLimitReached(true);
      }
    } else {
      setLimitReached(false);
    }
  }, [isSignedIn]);

  const loadingText = useMemo(() => loadingLines[Math.min(store.currentStep - 1, loadingLines.length - 1)], [store.currentStep]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (description.length < 50) {
      setError("Describe the process in at least 50 characters.");
      return;
    }

    // Check free limit
    if (!isSignedIn) {
      const count = parseInt(localStorage.getItem("free_audit_count") || "0", 10);
      if (count >= 2) {
        setLimitReached(true);
        return;
      }
      localStorage.setItem("free_audit_count", (count + 1).toString());
    }

    const form = new FormData();
    form.append("business_name", businessName || "Innoalaxy prospect");
    form.append("industry", industry);
    form.append("team_size", teamSize);
    form.append("process_description", description);
    if (email) form.append("email", email);
    if (file) form.append("file", file);
    store.setLoadingAudit(true);
    store.setStep(2);
    try {
      const token = await getToken();
      const result = await analyzeProcess(form, token || undefined);
      store.setAuditResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audit failed");
      store.setStep(1);
    } finally {
      store.setLoadingAudit(false);
    }
  }

  async function runDemo() {
    if (!store.auditResult?.submission_id) return;
    store.setLoadingAgent(true);
    const token = await getToken();
    const { run_id } = await runAgentDemo(store.auditResult.submission_id, token || undefined);
    store.setAgentRunId(run_id);
  }

  useEffect(() => {
    if (!store.agentRunId) return;
    const id = window.setInterval(async () => {
      const token = await getToken();
      const status = await getAgentStatus(store.agentRunId!, token || undefined);
      store.setAgentLogs(status.logs);
      store.setAgentOutput(status.output);
      if (status.status === "completed" || status.status === "failed") {
        store.setLoadingAgent(false);
        window.clearInterval(id);
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [store.agentRunId, getToken]);

  if (!isLoaded) return null;

  const content = (
    <>
      {!isSignedIn && <Navbar />}
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`h-2 rounded-full ${store.currentStep >= step ? "bg-primary" : "bg-slate-200"}`} />
          ))}
        </div>
        
        {limitReached && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-6 text-center">
            <h2 className="mb-2 text-xl font-bold text-blue-900">Free Audit Limit Reached</h2>
            <p className="mb-4 text-blue-800">You've used up your 2 free workflow audits. Sign up or log in to run unlimited AI analyses and save your history!</p>
            <SignInButton mode="modal">
              <Button>Login / Sign Up</Button>
            </SignInButton>
          </div>
        )}

        {!limitReached && store.currentStep === 1 && (
          <motion.form initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} onSubmit={submit} className="rounded-lg border border-line bg-white p-6">
            <h1 className="font-['DM_Sans'] text-3xl font-bold">Get your AI workflow audit</h1>
            <p className="mt-2 text-slate-600">Describe one repetitive process. We will estimate what can be automated and how.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <input className="rounded-md border border-line px-3 py-2" placeholder="Business name" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              <input className="rounded-md border border-line px-3 py-2" placeholder="Work email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select className="rounded-md border border-line px-3 py-2" value={industry} onChange={(e) => setIndustry(e.target.value)}>{industries.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="rounded-md border border-line px-3 py-2" value={teamSize} onChange={(e) => setTeamSize(e.target.value)}>{teamSizes.map((x) => <option key={x}>{x}</option>)}</select>
            </div>
            <textarea className="mt-4 min-h-44 w-full rounded-md border border-line px-3 py-3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Example: Our sales team checks IndiaMART every morning, copies leads to Excel, then sends WhatsApp messages one by one..." />
            <div className="mt-2 flex justify-between text-sm text-slate-500"><span>{description.length}/8000 characters</span><span>Minimum 50</span></div>
            <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-line p-4 text-sm text-slate-600">
              <Upload size={18} /> {file ? file.name : "Upload PDF, Word, or Excel context under 10MB"}
              <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </label>
            {error && <p className="mt-4 text-sm font-semibold text-red-600">{error}</p>}
            <Button className="mt-6" disabled={store.loadingAudit}>Analyze my process <ArrowRight size={16} /></Button>
          </motion.form>
        )}
        {store.currentStep === 2 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-line bg-white p-6">
            {store.loadingAudit || !store.auditResult ? (
              <DeepResearchTree />
            ) : (
              <div>
                <h1 className="font-['DM_Sans'] text-3xl font-bold">Your automation audit</h1>
                <div className="mt-3 text-slate-700 leading-relaxed text-lg prose prose-slate max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{store.auditResult.summary}</ReactMarkdown>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Metric label="Automation score" value={`${store.auditResult.automation_score}%`} />
                  <Metric label="Potential weekly reduction" value={`${store.auditResult.hours_wasted_weekly} hrs`} />
                  <Metric label="Pain points" value={`${store.auditResult.pain_points.length}`} />
                </div>
                <div className="mt-6 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-primary" style={{ width: `${store.auditResult.automation_score}%` }} /></div>
                <div className="mt-6 space-y-3">{store.auditResult.pain_points.map((p) => <div key={p.title} className="rounded-md border border-line p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold">{p.title}</h3><span className="text-sm font-semibold text-primary">{p.priority}</span></div><p className="mt-2 text-sm text-slate-600">{p.description}</p><p className="mt-2 text-sm text-slate-500">{p.time_wasted_hours} hrs/week · {p.automation_type}</p></div>)}</div>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => store.setStep(1)}>Back</Button>
                  <Button onClick={() => store.setStep(3)}>See your blueprint <ArrowRight size={16} /></Button>
                </div>
              </div>
            )}
          </motion.section>
        )}
        {store.currentStep === 3 && store.auditResult?.blueprint && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Zap className="text-amber-500" size={32} />
              <h1 className="font-['DM_Sans'] text-4xl font-extrabold text-ink">Optimized Blueprint & Tooling</h1>
            </div>
            
            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 mb-8">
                <h3 className="font-semibold text-lg mb-3 text-emerald-800 flex items-center gap-2"><Search size={18}/> Industry Context & AI Strategy</h3>
                <p className="text-emerald-900 leading-relaxed font-medium">{store.auditResult.industry_context}</p>
            </div>

            <div className="grid gap-5">
                {store.auditResult.blueprint.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-5 p-6 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xl border border-primary/20">{idx + 1}</div>
                        <div>
                            <h4 className="font-bold text-xl text-ink">{step.title}</h4>
                            <p className="text-slate-600 mt-2 leading-relaxed text-base">{step.description}</p>
                            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700 border border-slate-200">
                                <Zap size={14} className="text-amber-500" />
                                Tool: {step.tool}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-line">
                <div className="rounded-xl p-6 bg-blue-50 border border-blue-100 text-center">
                    <div className="text-sm font-bold text-blue-600 uppercase tracking-wide">Build Time</div>
                    <div className="text-4xl font-extrabold text-blue-900 mt-2">{store.auditResult.blueprint.build_time_weeks} Weeks</div>
                </div>
                <div className="rounded-xl p-6 bg-purple-50 border border-purple-100 text-center">
                    <div className="text-sm font-bold text-purple-600 uppercase tracking-wide">Hours Saved Weekly</div>
                    <div className="text-4xl font-extrabold text-purple-900 mt-2">{store.auditResult.blueprint.hours_saved_weekly} hrs</div>
                </div>
            </div>

            <div className="mt-8 rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center">
              <h4 className="font-bold text-lg text-primary mb-2">Ready to build your custom AI software?</h4>
              <p className="text-slate-700 mb-4">Get in touch with our team directly to turn this blueprint into reality.</p>
              <a href="mailto:piyush.tamoli@innoalaxy.in" className="inline-flex items-center justify-center font-bold text-primary hover:underline text-lg">
                piyush.tamoli@innoalaxy.in
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-4 border-t border-line pt-6">
              <Button variant="outline" onClick={() => store.setStep(2)}>Back</Button>
              <Button onClick={() => store.setStep(4)}>See live agent demo <ArrowRight size={16} /></Button>
            </div>
          </motion.section>
        )}
        {store.currentStep === 4 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-line bg-white p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <h1 className="font-['DM_Sans'] text-4xl font-extrabold text-ink">Business Software Agent Demo</h1>
              {store.agentOutput && (
                <Button onClick={handleDownloadPdf} className="bg-slate-800 text-white hover:bg-slate-900 shadow-md">
                  <Upload size={16} className="mr-2 rotate-180" /> Export PDF
                </Button>
              )}
            </div>
            <p className="text-lg text-slate-600">Watch our Validation Agent actively research tools, map integrations, and formulate your final optimization plan in real-time.</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button variant="outline" onClick={() => store.setStep(3)}>Back</Button>
              <Button onClick={runDemo} disabled={store.loadingAgent || Boolean(store.agentRunId)}><Play size={16} /> Start Live Demo</Button>
            </div>
            
            <div className="mt-8 min-h-72 rounded-xl bg-slate-900 p-6 font-mono text-sm text-blue-100 shadow-inner overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-primary to-purple-500 opacity-50" />
              {store.agentLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 pt-16">
                  <Play size={48} className="mb-4 opacity-20" />
                  <p>Click "Start Live Demo" to initialize the agent.</p>
                </div>
              ) : (
                store.agentLogs.map((log) => (
                  <p key={`${log.timestamp}-${log.message}`} className="mb-2 tracking-wide leading-relaxed">
                    <span className="text-emerald-400 font-semibold mr-3">[{new Date(log.timestamp).toLocaleTimeString()}]</span> 
                    {log.message}
                  </p>
                ))
              )}
            </div>

            {store.agentOutput && (
              <div ref={printRef} className="mt-10 rounded-2xl border border-line bg-white shadow-xl overflow-hidden print-container">
                <div className="bg-emerald-50 border-b border-emerald-100 p-6 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-600" size={28} />
                    <h3 className="font-bold text-2xl text-emerald-900 font-['DM_Sans']">Final Optimization Plan</h3>
                  </div>
                  {businessName && <span className="font-bold text-emerald-800">{businessName}</span>}
                </div>
                <div className="p-8 text-base bg-white">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-3xl font-extrabold mt-8 mb-4 text-ink font-['DM_Sans']" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-8 mb-4 text-ink border-b border-line pb-2 font-['DM_Sans']" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-6 mb-3 text-ink" {...props} />,
                      p: ({node, ...props}) => <p className="mb-5 text-slate-700 leading-relaxed text-lg" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc pl-6 mb-5 text-slate-700 space-y-2 text-lg" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal pl-6 mb-5 text-slate-700 space-y-2 text-lg font-semibold" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      strong: ({node, ...props}) => <strong className="font-bold text-ink" {...props} />,
                      a: ({node, ...props}) => <a className="text-primary font-semibold hover:underline" {...props} />
                    }}
                  >
                    {store.agentOutput}
                  </ReactMarkdown>
                </div>
              </div>
            )}
            
            <div className="mt-10 rounded-xl border-2 border-primary/20 bg-primary/5 p-8 text-center">
              <h4 className="font-bold text-2xl text-primary mb-3">Ready to build your custom AI software?</h4>
              <p className="text-slate-700 text-lg mb-6">Our engineering team is ready to execute this plan for your business.</p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
                <a href="mailto:piyush.tamoli@innoalaxy.in" className="text-lg font-bold text-primary hover:underline px-4">
                  piyush.tamoli@innoalaxy.in
                </a>
                <a href="https://wa.me/917509893717?text=Hello%20Innoalaxy%20team!%20I%20just%20completed%20the%20AI%20audit%20for%20my%20startup%20and%20I%27m%20interested%20in%20building%20a%20custom%20AI%20agent%20or%20software." target="_blank" rel="noopener noreferrer">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white text-base py-6 px-8 shadow-lg shadow-emerald-600/30">
                    <MessageCircle size={20} className="mr-2" /> Chat on WhatsApp
                  </Button>
                </a>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center border-t border-line pt-8">
              <Button variant="outline" onClick={store.reset} className="text-slate-500 hover:text-ink">
                <RotateCcw size={16} /> Start a new audit
              </Button>
            </div>
          </motion.section>
        )}
      </div>
    </>
  );

  if (isSignedIn) {
    return (
      <DashboardLayout activePath="/audit">
        {content}
      </DashboardLayout>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-ink">
      {content}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-['DM_Sans'] text-3xl font-bold">{value}</p></div>;
}
