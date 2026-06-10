import { motion } from "framer-motion";
import { Brain, Cpu, Blocks, Network, Search, ScanLine, Code2 } from "lucide-react";
import { useEffect, useState } from "react";

const nodes = [
  { id: 1, label: "AI Agent Builder", icon: Brain, angle: 0 },
  { id: 2, label: "Custom Software", icon: Code2, angle: 60 },
  { id: 3, label: "Vision Research", icon: ScanLine, angle: 120 },
  { id: 4, label: "Data Extractor", icon: Search, angle: 180 },
  { id: 5, label: "Animation Engine", icon: Blocks, angle: 240 },
  { id: 6, label: "Logic Orchestrator", icon: Network, angle: 300 },
];

const scanningTexts = [
  "Finding exactly what your business needs...",
  "Researching optimal AI agents...",
  "Connecting custom software pipelines...",
  "Building your automation tool tree...",
  "Structuring vision and data workflows...",
];

export function AnalysisAnimation() {
  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % scanningTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative flex h-80 w-full max-w-lg items-center justify-center">
        {/* Central Hub */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.1, 1], opacity: 1 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="z-10 flex h-24 w-24 flex-col items-center justify-center rounded-full bg-primary text-white shadow-[0_0_30px_rgba(37,99,235,0.5)]"
        >
          <Cpu size={32} />
        </motion.div>

        {/* Orbiting Nodes and Lines */}
        {nodes.map((node, index) => {
          const delay = index * 0.5;
          // Calculate positions on a circle of radius 110px
          const radius = 120;
          const rad = (node.angle * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;

          return (
            <div key={node.id} className="absolute inset-0 flex items-center justify-center">
              {/* Connecting Line */}
              <svg className="absolute inset-0 h-full w-full pointer-events-none">
                <motion.line
                  x1="50%"
                  y1="50%"
                  x2={`calc(50% + ${x}px)`}
                  y2={`calc(50% + ${y}px)`}
                  stroke="#cbd5e1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 0.5 }}
                  transition={{ duration: 1, delay: delay + 0.5 }}
                />

              </svg>

              {/* Node Icon */}
              <motion.div
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 1, scale: 1, x, y }}
                transition={{ duration: 0.6, delay, type: "spring" }}
                className="absolute flex flex-col items-center gap-2"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-line bg-white text-primary shadow-sm">
                  <node.icon size={20} />
                </div>
                <div className="rounded-md border border-line bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur-sm whitespace-nowrap">
                  {node.label}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 text-center">
        <h2 className="font-['DM_Sans'] text-2xl font-bold text-ink">Innoalaxy AI is analyzing...</h2>
        <motion.p
          key={textIndex}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="mt-2 text-sm font-medium text-slate-500"
        >
          {scanningTexts[textIndex]}
        </motion.p>
      </div>
    </div>
  );
}
