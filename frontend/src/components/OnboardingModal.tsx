import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CheckCircle, Sparkles } from "lucide-react";
import { Button } from "./ui/Button";

export function OnboardingModal() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    // Only show if user is logged in
    if (!user) return;

    // Check if we already showed onboarding for this user
    const hasSeen = localStorage.getItem(`onboarding_${user.id}`);
    
    // For testing/MVP, let's just show it if they haven't seen it
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, [user]);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Finish onboarding
      if (user) {
        localStorage.setItem(`onboarding_${user.id}`, "true");
      }
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white p-8 shadow-2xl"
        >
          {/* Progress bar */}
          <div className="absolute left-0 right-0 top-0 h-1.5 bg-slate-100">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <div className="mt-4">
            {step === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="mb-6 inline-flex rounded-full bg-blue-50 p-3 text-primary">
                  <Sparkles size={28} />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-ink">
                  Hello, {user?.firstName || "there"}!
                </h2>
                <p className="text-lg text-slate-600">
                  Welcome to Innoalaxy. We improve business startup productivity by identifying repetitive tasks and replacing them with custom AI agents.
                </p>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="mb-6 inline-flex rounded-full bg-blue-50 p-3 text-primary">
                  <CheckCircle size={28} />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-ink">
                  Your AI Memory is Active
                </h2>
                <p className="text-lg text-slate-600">
                  From now on, all your AI Audits and Chat sessions will be saved to your account. You can revisit them anytime in your Dashboard.
                </p>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="mb-6 inline-flex rounded-full bg-blue-50 p-3 text-primary">
                  <ArrowRight size={28} />
                </div>
                <h2 className="mb-2 text-2xl font-bold text-ink">
                  Next Guidance Step
                </h2>
                <p className="text-lg text-slate-600">
                  Ready to optimize? Click "Get Started" to run your first AI Audit, or visit your Dashboard to see your history.
                </p>
              </motion.div>
            )}
          </div>

          <div className="mt-8 flex justify-end gap-3">
            <Button onClick={handleNext}>
              {step === 3 ? "Let's Go" : "Next step"} <ArrowRight size={16} />
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
