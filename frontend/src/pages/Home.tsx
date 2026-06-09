import { motion } from "framer-motion";
import {
  ArrowRight,
  Zap,
  Brain,
  Plug,
  Wrench,
  FileText,
  Users,
  BarChart3,
  MessageSquare,
  Database,
  TrendingUp,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Building2,
  Rocket,
  Heart,
} from "lucide-react";
import { Navbar } from "../components/layout/Navbar";

/* ─── animation helpers ─── */
const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

/* ─── data ─── */
const painPoints = [
  { icon: FileText, title: "Endless Excel Sheets", desc: "Manual data management eating hours daily" },
  { icon: BarChart3, title: "Repetitive Reporting", desc: "Same reports built from scratch every week" },
  { icon: Zap, title: "Inefficient Workflows", desc: "Disconnected tools causing bottlenecks" },
  { icon: AlertTriangle, title: "Human Errors", desc: "Costly mistakes from manual processes" },
  { icon: Database, title: "Data Chaos", desc: "Scattered data across dozens of platforms" },
];

const solutions = [
  {
    icon: Zap,
    title: "Workflow Automation",
    desc: "Automate repetitive tasks end-to-end. From data entry to complex multi-step processes.",
  },
  {
    icon: Brain,
    title: "AI-Powered Optimization",
    desc: "Leverage machine learning to identify bottlenecks and continuously improve operations.",
  },
  {
    icon: Plug,
    title: "AI System Integration",
    desc: "Connect your existing tools with intelligent automation. CRMs, ERPs, databases — all in harmony.",
  },
  {
    icon: Wrench,
    title: "Custom Business Tools",
    desc: "Bespoke automation solutions built for your unique workflows.",
  },
];

const services = [
  { icon: Brain, name: "AI Workflow Audit", detail: "Free tool — AI finds your automation gaps" },
  { icon: Wrench, name: "Custom AI Agent Build", detail: "We build the agent for you, end to end" },
  { icon: MessageSquare, name: "WhatsApp Automation", detail: "Leads, follow-ups, reports — all on WhatsApp" },
  { icon: FileText, name: "Document Automation", detail: "Invoice, contract, PDF extraction agents" },
  { icon: Database, name: "CRM & Data Sync", detail: "Auto-sync leads from IndiaMART, Justdial, forms" },
  { icon: BarChart3, name: "AI Reporting Agent", detail: "Weekly business reports generated automatically" },
];

const industries = [
  { icon: BookOpen, title: "Educational Institutions", desc: "Automate admissions, grading, and student management" },
  { icon: Building2, title: "Small Businesses", desc: "Streamline operations without enterprise budgets" },
  { icon: Rocket, title: "Startups", desc: "Scale fast with automation-first infrastructure" },
  { icon: Users, title: "HR & Operations Teams", desc: "Eliminate manual HR workflows and data entry" },
  { icon: Heart, title: "NGOs", desc: "Maximize impact with efficient resource management" },
];

const steps = [
  {
    number: "01",
    label: "Find",
    title: "Find",
    desc: "Describe your process. Our AI audits your workflow and identifies every repetitive task wasting your team's time. Free. Takes 5 minutes.",
    color: "from-blue-500 to-blue-600",
  },
  {
    number: "02",
    label: "Build",
    title: "Build",
    desc: "We build a custom AI agent for your exact problem using Gemini + Google ADK. No generic tools. Built for your business, your data, your workflow.",
    color: "from-violet-500 to-violet-600",
  },
  {
    number: "03",
    label: "Automate",
    title: "Automate",
    desc: "Your agent runs 24/7. Leads get followed up. Reports get generated. Data gets entered. Your team focuses on work that actually matters.",
    color: "from-emerald-500 to-emerald-600",
  },
];

/* ─── mock workflow pipeline (hero right panel) ─── */
const pipelineSteps = [
  { label: "On Form Submit", color: "bg-emerald-500", done: true },
  { label: "AI Agent", color: "bg-primary", done: true },
  { label: "Is Manager?", color: "bg-amber-500", done: false },
  { label: "Slack: Invite", color: "bg-slate-300", done: false },
  { label: "Update Profile", color: "bg-slate-300", done: false },
];

/* ─── mock errors table (section 2 right panel) ─── */
const errorRows = [
  { file: "report_03.xlsx", error: "Duplicate entry row 182", type: "warn" },
  { file: "invoice_2881.csv", error: "Missing field amount", type: "warn" },
  { file: "contacts_v12.xlsx", error: "Format mismatch col 0", type: "warn" },
  { file: "payroll_aug.xlsx", error: "Calc error col F23", type: "error" },
];

/* ─── mock lead pipeline (section 3 left panel) ─── */
const leadPipeline = [
  { label: "trigger: New Lead", icon: "⚡", done: true },
  { label: "AI: Qualify Lead", icon: "🤖", done: true },
  { label: "CRM: Create Contact", icon: "📋", active: true },
  { label: "Email: Send Welcome", icon: "📧", done: false },
  { label: "Slack: Notify Team", icon: "💬", done: false },
];

/* ─────────────────────── Component ─────────────────────── */
export function Home() {
  return (
    <main className="min-h-screen bg-[#F4F6F9] text-ink font-sans">
      <Navbar />

      {/* ── SECTION 1 — Hero ── */}
      <section className="pt-28 pb-20 bg-[#F4F6F9]">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1fr_460px] gap-12 items-center">
          {/* Left copy */}
          <motion.div {...fadeUp(0)}>
            <h1 className="font-['DM_Sans'] text-5xl md:text-6xl font-bold leading-[1.1] text-ink mb-6">
              Automate.{" "}
              <span className="text-primary">Optimize.</span>
              <br />
              Scale.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-lg mb-3">
              <strong className="text-ink">We find where your business wastes time.</strong> We build the AI that eliminates it.
            </p>
            <p className="text-base text-slate-500 leading-relaxed max-w-lg mb-8">
              Businesses waste 10–20 hours every week on repetitive manual work. We audit your workflow, identify exactly what's slowing you down, and build custom AI agents that do that work automatically.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/audit"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200"
              >
                Get Workflow Audit <ArrowRight size={16} />
              </a>
              <a
                href="#solutions"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-ink hover:border-gray-300 transition-all"
              >
                Explore Solutions
              </a>
            </div>
          </motion.div>

          {/* Right — two mock panels */}
          <motion.div {...fadeUp(0.15)} className="relative hidden lg:block">
            {/* automation_report panel */}
            <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">automation_report.xlsx</span>
                </div>
                <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                  <Zap size={11} /> Auto-filling
                </span>
              </div>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-gray-100">
                    <th className="text-left py-1.5 font-medium">Name</th>
                    <th className="text-left py-1.5 font-medium">Status</th>
                    <th className="text-left py-1.5 font-medium">Revenue</th>
                    <th className="text-left py-1.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: "Acme Corp", status: "Active", rev: "₹12,400", action: "Synced" },
                    { name: "Globe Inc", status: "Pending", rev: "₹8,750", action: "Processing" },
                    { name: "Nova Ltd", status: "Active", rev: "₹23,100", action: "Synced" },
                    { name: "SoftIO", status: "Review", rev: "₹5,200", action: "Updating" },
                    { name: "Peak Co", status: "Active", rev: "₹15,000", action: "Synced" },
                  ].map((row) => (
                    <tr key={row.name} className="border-b border-gray-50">
                      <td className="py-1.5 font-medium text-ink">{row.name}</td>
                      <td className="py-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            row.status === "Active"
                              ? "bg-emerald-100 text-emerald-700"
                              : row.status === "Pending"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="py-1.5 text-slate-600">{row.rev}</td>
                      <td className="py-1.5 text-blue-600 flex items-center gap-1">
                        <CheckCircle2 size={10} /> {row.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] text-slate-400 mt-2">5/5 rows synced · <span className="text-blue-500">● Live</span></p>
            </div>

            {/* Right workflow pipeline */}
            <div className="absolute -right-6 top-0 w-44 space-y-2">
              {pipelineSteps.map((s, i) => (
                <div
                  key={s.label}
                  className={`flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-xs font-medium shadow-sm ${
                    s.done ? "border-emerald-200 text-emerald-700" : s.color === "bg-amber-500" ? "border-amber-200 text-amber-700" : "border-gray-200 text-slate-500"
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  {s.label}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 2 — Pain Points ── */}
      <section className="py-20 bg-white" id="pain">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[1fr_380px] gap-12 items-start">
          {/* Left */}
          <div>
            <motion.div {...fadeUp(0)}>
              <h2 className="font-['DM_Sans'] text-4xl md:text-5xl font-bold text-ink mb-3">
                Still Running Your Business on{" "}
                <span className="text-primary">Manual Processes?</span>
              </h2>
              <p className="text-slate-500 mb-10">These inefficiencies are costing you time, money, and growth.</p>
            </motion.div>
            <div className="grid sm:grid-cols-3 gap-4 mb-4">
              {painPoints.slice(0, 3).map((p, i) => (
                <motion.div key={p.title} {...fadeUp(i * 0.08)}
                  className="rounded-xl border border-gray-200 bg-[#F4F6F9] p-5 hover:shadow-md transition-all"
                >
                  <p.icon className="text-primary mb-3" size={22} />
                  <h3 className="font-semibold text-sm text-ink mb-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {painPoints.slice(3).map((p, i) => (
                <motion.div key={p.title} {...fadeUp(0.24 + i * 0.08)}
                  className="rounded-xl border border-gray-200 bg-[#F4F6F9] p-5 hover:shadow-md transition-all"
                >
                  <p.icon className="text-primary mb-3" size={22} />
                  <h3 className="font-semibold text-sm text-ink mb-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right — error log mock */}
          <motion.div {...fadeUp(0.2)} className="hidden lg:block sticky top-28">
            <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-slate-500 font-mono">manual_process.log</span>
              </div>
              <div className="space-y-2">
                {errorRows.map((r) => (
                  <div key={r.file} className="flex items-start justify-between text-xs border-b border-gray-50 pb-2">
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <FileText size={12} />
                      <span>{r.file}</span>
                    </div>
                    <span className={r.type === "error" ? "text-red-500" : "text-amber-600"}>
                      {r.error}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                  <AlertTriangle size={11} /> 4 errors found
                </span>
                <span className="text-[11px] text-slate-400">⏱ 3.2hrs wasted</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 3 — Solutions ── */}
      <section className="py-20 bg-[#F4F6F9]" id="solutions">
        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-[380px_1fr] gap-12 items-start">
          {/* Left — lead pipeline mock */}
          <motion.div {...fadeUp(0)} className="hidden lg:block sticky top-28">
            <div className="rounded-xl border border-gray-200 bg-white shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-slate-500 font-mono">lead_pipeline.flow</span>
                </div>
                <span className="text-xs text-green-600 font-semibold">▶ Running</span>
              </div>
              <div className="space-y-2">
                {leadPipeline.map((s) => (
                  <div
                    key={s.label}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium border ${
                      s.active
                        ? "bg-blue-50 border-blue-200 text-primary"
                        : s.done
                        ? "bg-gray-50 border-gray-100 text-slate-500"
                        : "bg-white border-gray-100 text-slate-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{s.icon}</span> {s.label}
                    </span>
                    {s.done && <CheckCircle2 size={12} className="text-green-500" />}
                    {s.active && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right */}
          <div>
            <motion.div {...fadeUp(0)}>
              <h2 className="font-['DM_Sans'] text-4xl md:text-5xl font-bold text-ink mb-2">
                Intelligent Automation.{" "}
                <span className="text-primary">Real Business Impact.</span>
              </h2>
              <p className="text-slate-500 mb-10">End-to-end solutions designed around your operations.</p>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-5">
              {solutions.map((s, i) => (
                <motion.div key={s.title} {...fadeUp(i * 0.1)}
                  className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <s.icon size={20} className="text-white" />
                  </div>
                  <h3 className="font-['DM_Sans'] font-bold text-ink mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Services table */}
            <motion.div {...fadeUp(0.3)} className="mt-10">
              <h3 className="font-['DM_Sans'] text-2xl font-bold text-ink mb-5">Services We Offer</h3>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                {services.map((svc, i) => (
                  <div
                    key={svc.name}
                    className={`flex items-center gap-4 px-5 py-4 ${
                      i < services.length - 1 ? "border-b border-gray-100" : ""
                    } hover:bg-slate-50 transition-colors group cursor-default`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <svc.icon size={16} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{svc.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{svc.detail}</p>
                    </div>
                    <ChevronRight size={14} className="text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — Industries ── */}
      <section className="py-20 bg-white" id="industries">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp(0)} className="text-center mb-12">
            <h2 className="font-['DM_Sans'] text-4xl md:text-5xl font-bold text-ink mb-3">
              Built for <span className="text-primary">Every Industry</span>
            </h2>
            <p className="text-slate-500">Tailored automation solutions for diverse sectors.</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {industries.map((ind, i) => (
              <motion.div key={ind.title} {...fadeUp(i * 0.08)}
                className="rounded-xl border border-gray-200 bg-[#F4F6F9] p-6 text-center hover:shadow-md hover:-translate-y-1 transition-all group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary transition-colors">
                  <ind.icon size={20} className="text-primary group-hover:text-white transition-colors" />
                </div>
                <h3 className="font-semibold text-sm text-ink mb-2 leading-tight">{ind.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{ind.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Who it's for — target personas */}
          <motion.div {...fadeUp(0.3)} className="mt-12 rounded-2xl bg-[#F4F6F9] border border-gray-200 p-8">
            <h3 className="font-['DM_Sans'] text-xl font-bold text-ink mb-5">Who It's For</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                "B2B sales teams spending hours on manual follow-ups",
                "Manufacturing businesses doing manual data entry",
                "HR teams processing CVs and onboarding manually",
                "Finance teams entering invoices by hand",
                "Any Indian SME with repetitive work killing team productivity",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 size={16} className="text-primary mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SECTION 5 — How It Works ── */}
      <section className="py-20 bg-[#F4F6F9]" id="how">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp(0)} className="text-center mb-14">
            <h2 className="font-['DM_Sans'] text-4xl md:text-5xl font-bold text-ink mb-3">
              How <span className="text-primary">Innoalaxy</span> Works
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Every business in India should run on intelligent automation — not manual effort.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {steps.map((s, i) => (
              <motion.div key={s.number} {...fadeUp(i * 0.12)}
                className="relative rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-lg transition-all overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${s.color}`} />
                <span className={`text-5xl font-['DM_Sans'] font-black bg-gradient-to-br ${s.color} bg-clip-text text-transparent mb-6 block`}>
                  {s.number}
                </span>
                <h3 className="font-['DM_Sans'] text-2xl font-bold text-ink mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — Pricing ── */}
      <section className="py-20 bg-white" id="pricing">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div {...fadeUp(0)} className="text-center mb-12">
            <h2 className="font-['DM_Sans'] text-4xl font-bold text-ink mb-3">
              Simple, <span className="text-primary">Transparent Pricing</span>
            </h2>
            <p className="text-slate-500">No hidden fees. Pay only for what you need.</p>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                name: "Free Audit",
                price: "₹0",
                sub: "Always free",
                desc: "AI scans your workflow and surfaces automation opportunities in minutes.",
                features: ["Workflow analysis", "Pain point report", "Automation score", "Blueprint preview"],
                cta: "Start Free Audit",
                href: "/audit",
                highlight: false,
              },
              {
                name: "Agent Build",
                price: "₹25k – ₹1.5L",
                sub: "One-time build",
                desc: "Custom AI agent designed and shipped for your exact business process.",
                features: ["End-to-end build", "Gemini + Google ADK", "WhatsApp integration", "Full testing & handoff"],
                cta: "Get a Quote",
                href: "#contact",
                highlight: true,
              },
              {
                name: "Monthly Support",
                price: "₹5k – ₹25k",
                sub: "Per month",
                desc: "Ongoing maintenance, improvements, and monitoring of your AI agents.",
                features: ["Agent monitoring", "Bug fixes & updates", "Performance tuning", "Priority support"],
                cta: "Talk to Us",
                href: "#contact",
                highlight: false,
              },
            ].map((plan, i) => (
              <motion.div key={plan.name} {...fadeUp(i * 0.1)}
                className={`rounded-2xl border p-7 flex flex-col ${
                  plan.highlight
                    ? "border-primary bg-primary text-white shadow-xl shadow-blue-200 scale-105"
                    : "border-gray-200 bg-[#F4F6F9]"
                }`}
              >
                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${plan.highlight ? "text-blue-100" : "text-primary"}`}>
                  {plan.name}
                </p>
                <p className={`font-['DM_Sans'] text-3xl font-black mb-0.5 ${plan.highlight ? "text-white" : "text-ink"}`}>
                  {plan.price}
                </p>
                <p className={`text-xs mb-4 ${plan.highlight ? "text-blue-200" : "text-slate-400"}`}>{plan.sub}</p>
                <p className={`text-sm leading-relaxed mb-6 ${plan.highlight ? "text-blue-100" : "text-slate-500"}`}>
                  {plan.desc}
                </p>
                <ul className="space-y-2 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? "text-blue-50" : "text-slate-600"}`}>
                      <CheckCircle2 size={14} className={plan.highlight ? "text-blue-200" : "text-primary"} />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={plan.href}
                  className={`block text-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-all ${
                    plan.highlight
                      ? "bg-white text-primary hover:bg-blue-50"
                      : "bg-primary text-white hover:bg-blue-700"
                  }`}
                >
                  {plan.cta}
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7 — Contact / CTA Form ── */}
      <section className="py-20 bg-[#F4F6F9]" id="contact">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div {...fadeUp(0)} className="text-center mb-10">
            <h2 className="font-['DM_Sans'] text-4xl font-bold text-ink mb-3">
              Ready to Optimize{" "}
              <span className="text-primary">Your Workflow?</span>
            </h2>
            <p className="text-slate-500">Fill in the details below and we'll get back to you with a free workflow audit.</p>
          </motion.div>

          <motion.div {...fadeUp(0.1)} className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                window.location.href = "/audit";
              }}
              className="space-y-4"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Full Name *"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Email Address *"
                    className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <input
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
                <input
                  type="text"
                  placeholder="Company Name"
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
              <select
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="" disabled>Select Service Type *</option>
                <option value="audit">AI Workflow Audit</option>
                <option value="agent">Custom AI Agent Build</option>
                <option value="whatsapp">WhatsApp Automation</option>
                <option value="document">Document Automation</option>
                <option value="crm">CRM & Data Sync</option>
                <option value="reporting">AI Reporting Agent</option>
              </select>
              <select
                required
                defaultValue=""
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              >
                <option value="" disabled>What Type of Automation Do You Need? *</option>
                <option value="sales">Sales & Lead Follow-up</option>
                <option value="data">Data Entry & Sync</option>
                <option value="reporting">Reporting & Analytics</option>
                <option value="hr">HR & Onboarding</option>
                <option value="finance">Finance & Invoicing</option>
                <option value="communication">Communication & WhatsApp</option>
              </select>
              <input
                type="url"
                placeholder="AI Website Integration (Optional)"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <textarea
                rows={3}
                placeholder="Tell us more about your needs (optional)"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-ink placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all resize-none"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-6 py-3.5 text-white text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-200 flex items-center justify-center gap-2"
              >
                Submit &amp; Get Free Audit <ArrowRight size={16} />
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-ink text-white py-12">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              </div>
              <span className="font-['DM_Sans'] font-bold text-lg">Innoalaxy</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every business in India should run on intelligent automation — not manual effort.
            </p>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Platform</p>
            <div className="space-y-2">
              {["AI Workflow Audit", "Custom AI Agents", "WhatsApp Automation", "Reporting Agents"].map((l) => (
                <a key={l} href="/audit" className="block text-sm text-slate-400 hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Company</p>
            <div className="space-y-2">
              {["About", "Blog", "Privacy Policy", "Terms"].map((l) => (
                <a key={l} href="#" className="block text-sm text-slate-400 hover:text-white transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Get Started</p>
            <a href="/audit" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-blue-700 transition-all">
              Free Audit <ArrowRight size={14} />
            </a>
            <p className="text-xs text-slate-500 mt-4">Made with ❤️ for Indian SMEs</p>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 mt-8 pt-8 border-t border-white/10 text-center text-xs text-slate-500">
          © 2025 Innoalaxy. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
