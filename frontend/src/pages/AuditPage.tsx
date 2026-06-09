import { FormEvent, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, CheckCircle, FileText, Play, RotateCcw, Upload } from "lucide-react";
import { analyzeProcess, getAgentStatus, runAgentDemo } from "../lib/api";
import { useAuditStore } from "../store/auditStore";
import { Navbar } from "../components/layout/Navbar";
import { Button } from "../components/ui/Button";

const industries = ["B2B Manufacturing", "SaaS", "HR & Recruitment", "Real Estate", "Logistics", "Healthcare", "Education", "Retail", "Finance", "Professional Services"];
const teamSizes = ["1-5", "6-15", "16-50", "51-200", "200+"];
const loadingLines = ["Reading workflow context", "Mapping manual handoffs", "Estimating hours wasted", "Drafting automation blueprint"];

export function AuditPage() {
  const store = useAuditStore();
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState(industries[0]);
  const [teamSize, setTeamSize] = useState(teamSizes[1]);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const loadingText = useMemo(() => loadingLines[Math.min(store.currentStep - 1, loadingLines.length - 1)], [store.currentStep]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (description.length < 50) {
      setError("Describe the process in at least 50 characters.");
      return;
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
      const result = await analyzeProcess(form);
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
    const { run_id } = await runAgentDemo(store.auditResult.submission_id);
    store.setAgentRunId(run_id);
  }

  useEffect(() => {
    if (!store.agentRunId) return;
    const id = window.setInterval(async () => {
      const status = await getAgentStatus(store.agentRunId!);
      store.setAgentLogs(status.logs);
      store.setAgentOutput(status.output);
      if (status.status === "completed" || status.status === "failed") {
        store.setLoadingAgent(false);
        window.clearInterval(id);
      }
    }, 2000);
    return () => window.clearInterval(id);
  }, [store.agentRunId]);

  return (
    <main className="min-h-screen bg-slate-50 text-ink">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`h-2 rounded-full ${store.currentStep >= step ? "bg-primary" : "bg-slate-200"}`} />
          ))}
        </div>
        {store.currentStep === 1 && (
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
              <div className="py-20 text-center"><FileText className="mx-auto mb-4 text-primary" /><h1 className="font-['DM_Sans'] text-3xl font-bold">{loadingText}</h1><p className="mt-2 text-slate-600">This usually takes a few seconds.</p></div>
            ) : (
              <div>
                <h1 className="font-['DM_Sans'] text-3xl font-bold">Your automation audit</h1>
                <p className="mt-2 text-slate-600">{store.auditResult.summary}</p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <Metric label="Automation score" value={`${store.auditResult.automation_score}%`} />
                  <Metric label="Hours wasted weekly" value={`${store.auditResult.hours_wasted_weekly}`} />
                  <Metric label="Pain points" value={`${store.auditResult.pain_points.length}`} />
                </div>
                <div className="mt-6 h-3 rounded-full bg-slate-100"><div className="h-3 rounded-full bg-primary" style={{ width: `${store.auditResult.automation_score}%` }} /></div>
                <div className="mt-6 space-y-3">{store.auditResult.pain_points.map((p) => <div key={p.title} className="rounded-md border border-line p-4"><div className="flex justify-between gap-3"><h3 className="font-semibold">{p.title}</h3><span className="text-sm font-semibold text-primary">{p.priority}</span></div><p className="mt-2 text-sm text-slate-600">{p.description}</p><p className="mt-2 text-sm text-slate-500">{p.time_wasted_hours} hrs/week · {p.automation_type}</p></div>)}</div>
                <Button className="mt-6" onClick={() => store.setStep(3)}>See your blueprint <ArrowRight size={16} /></Button>
              </div>
            )}
          </motion.section>
        )}
        {store.currentStep === 3 && store.auditResult?.blueprint && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-line bg-white p-6">
            <h1 className="font-['DM_Sans'] text-3xl font-bold">Automation blueprint</h1>
            <p className="mt-2 text-slate-600">{store.auditResult.industry_context}</p>
            <div className="mt-6 space-y-3">{store.auditResult.blueprint.steps.map((s, i) => <div key={s.title} className="rounded-md border border-line p-4"><p className="text-sm font-semibold text-primary">Step {i + 1} · {s.tool}</p><h3 className="mt-1 font-semibold">{s.title}</h3><p className="mt-1 text-sm text-slate-600">{s.description}</p></div>)}</div>
            <div className="mt-6 rounded-md border border-line bg-slate-50 p-4">
              <p className="font-semibold">{store.auditResult.blueprint.build_time_weeks} week build · {store.auditResult.blueprint.hours_saved_weekly} hrs saved weekly · {store.auditResult.blueprint.price_range}</p>
              <div className="mt-3 flex flex-wrap gap-2">{store.auditResult.blueprint.integrations.map((x) => <span key={x} className="rounded border border-line bg-white px-2 py-1 text-sm">{x}</span>)}</div>
            </div>
            <Button className="mt-6" onClick={() => store.setStep(4)}>See live agent <ArrowRight size={16} /></Button>
          </motion.section>
        )}
        {store.currentStep === 4 && (
          <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-line bg-white p-6">
            <h1 className="font-['DM_Sans'] text-3xl font-bold">Business software agent demo</h1>
            <p className="mt-2 text-slate-600">Watch an ADK-style agent inspect the workflow, map software integrations, and prepare an optimization plan.</p>
            <Button className="mt-6" onClick={runDemo} disabled={store.loadingAgent || Boolean(store.agentRunId)}><Play size={16} /> Run demo</Button>
            <div className="mt-6 min-h-72 rounded-lg bg-ink p-4 font-mono text-sm text-blue-100">
              {store.agentLogs.length === 0 ? <p className="text-slate-400">Integration and optimization logs will appear here.</p> : store.agentLogs.map((log) => <p key={`${log.timestamp}-${log.message}`}><span className="text-green-300">{new Date(log.timestamp).toLocaleTimeString()}</span> {log.message}</p>)}
            </div>
            {store.agentOutput && <div className="mt-4 rounded-md border border-line p-4 whitespace-pre-line"><CheckCircle className="mb-2 text-success" />{store.agentOutput}</div>}
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={import.meta.env.VITE_CALENDLY_URL ?? "#"}><Button><Calendar size={16} /> Book a free call</Button></a>
              <Button className="border-line bg-white text-ink" onClick={store.reset}><RotateCcw size={16} /> Start over</Button>
            </div>
          </motion.section>
        )}
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border border-line p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 font-['DM_Sans'] text-3xl font-bold">{value}</p></div>;
}
