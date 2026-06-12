import { motion } from "framer-motion";
import { Brain, Cpu, Database, Network, Search, Zap, Lightbulb, Rocket, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";

const scanningTexts = [
  "Initializing parallel RAG research...",
  "Scanning top AI Tools & Startups...",
  "Cross-referencing workflow memory...",
  "Extracting relevant enterprise solutions...",
  "Building final optimization architecture...",
  "Validation Agent verifying optimal tools...",
];

export function DeepResearchTree() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % scanningTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12 w-full max-w-6xl mx-auto overflow-hidden">
      
      {/* Tree Container */}
      <div className="relative flex flex-col items-center justify-center min-h-[400px] w-full mt-4">
        
        {/* Core Node */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.05, 1], opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="z-20 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-primary text-white shadow-[0_0_40px_rgba(37,99,235,0.6)]"
        >
          <Cpu size={32} />
          <span className="text-[10px] font-bold mt-1 tracking-wider uppercase">Core</span>
        </motion.div>

        {/* Level 1 Branches Container */}
        <div className="relative flex w-full justify-between px-2 mt-16">
          
          {/* Branch 1: AI Tools */}
          <div className="relative flex flex-col items-center w-1/4">
            <svg className="absolute -top-16 left-1/2 w-full h-16 pointer-events-none transform -translate-x-1/2 overflow-visible" viewBox="0 0 100 64" preserveAspectRatio="none">
              <motion.path
                d="M 50 0 Q 50 32, 50 64"
                fill="transparent"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </svg>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1 }}
              className="z-10 flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-200 bg-white text-blue-600 shadow-lg">
                <Brain size={24} />
              </div>
              <div className="rounded-md border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm">
                Top AI Tools
              </div>
            </motion.div>

            {/* Leaves for AI Tools */}
            <div className="flex justify-center gap-4 mt-8">
              {['Make.com', 'Zapier'].map((tool, i) => (
                <motion.div
                  key={tool}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 2 + (i * 0.3) }}
                  className="flex flex-col items-center"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 mb-2">
                    <Zap size={14} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">{tool}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Branch 2: Memory & Context */}
          <div className="relative flex flex-col items-center w-1/4">
            <svg className="absolute -top-16 left-1/2 w-full h-16 pointer-events-none transform -translate-x-1/2 overflow-visible" viewBox="0 0 100 64" preserveAspectRatio="none">
              <motion.path
                d="M 50 0 L 50 64"
                fill="transparent"
                stroke="#8b5cf6"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1, delay: 0.8 }}
              />
            </svg>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.3 }}
              className="z-10 flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-200 bg-white text-purple-600 shadow-lg">
                <Database size={24} />
              </div>
              <div className="rounded-md border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm whitespace-nowrap">
                RAG Memory
              </div>
            </motion.div>
            
            {/* Leaves for Memory */}
            <div className="flex justify-center mt-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 2.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 mb-2">
                    <Search size={14} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">Vector Matching</span>
                </motion.div>
            </div>
          </div>

          {/* Branch 3: AI Startups */}
          <div className="relative flex flex-col items-center w-1/4">
            <svg className="absolute -top-16 left-1/2 w-full h-16 pointer-events-none transform -translate-x-1/2 overflow-visible" viewBox="0 0 100 64" preserveAspectRatio="none">
              <motion.path
                d="M 50 0 L 50 64"
                fill="transparent"
                stroke="#10b981"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1, delay: 1.1 }}
              />
            </svg>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.6 }}
              className="z-10 flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-600 shadow-lg">
                <Rocket size={24} />
              </div>
              <div className="rounded-md border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm whitespace-nowrap">
                AI Startups
              </div>
            </motion.div>

            {/* Leaves for Startups */}
            <div className="flex justify-center gap-2 mt-8">
              {['Yellow.ai', 'Wysa'].map((startup, i) => (
                <motion.div
                  key={startup}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 3.2 + (i * 0.3) }}
                  className="flex flex-col items-center"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 mb-2">
                    <Lightbulb size={14} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">{startup}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Branch 4: Validation Agent (NEW) */}
          <div className="relative flex flex-col items-center w-1/4">
            <svg className="absolute -top-16 left-1/2 w-full h-16 pointer-events-none transform -translate-x-1/2 overflow-visible" viewBox="0 0 100 64" preserveAspectRatio="none">
              <motion.path
                d="M 50 0 Q 50 32, 50 64"
                fill="transparent"
                stroke="#f59e0b"
                strokeWidth="2"
                strokeDasharray="4 4"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1, delay: 1.4 }}
              />
            </svg>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 1.9 }}
              className="z-10 flex flex-col items-center gap-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-200 bg-white text-amber-500 shadow-lg relative">
                <CheckCircle size={24} />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 3 }}
                  className="absolute inset-0 rounded-2xl border-2 border-amber-400"
                />
              </div>
              <div className="rounded-md border border-line bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm whitespace-nowrap">
                Validation Agent
              </div>
            </motion.div>

            {/* Leaves for Validation */}
            <div className="flex justify-center gap-4 mt-8">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 3.5 }}
                  className="flex flex-col items-center"
                >
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-slate-500 mb-2">
                    <CheckCircle size={14} />
                  </div>
                  <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap">Optimal Tools</span>
                </motion.div>
            </div>
          </div>

        </div>

      </div>

      <div className="mt-12 text-center relative z-20 bg-white/80 p-4 rounded-xl backdrop-blur-sm border border-slate-100 shadow-sm">
        <h2 className="font-['DM_Sans'] text-2xl font-bold text-ink">Innoalaxy AI is analyzing...</h2>
        <motion.p
          key={textIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="mt-2 text-sm font-medium text-primary bg-primary/5 inline-block px-4 py-1.5 rounded-full border border-primary/10"
        >
          {scanningTexts[textIndex]}
        </motion.p>
      </div>
    </div>
  );
}
