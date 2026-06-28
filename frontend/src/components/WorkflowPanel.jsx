import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, AlertCircle, TrendingUp, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

const STEPS = [
  { id: 1, label: 'Image Uploaded', status: 'done', desc: 'office-workspace.jpg', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  { id: 2, label: 'AI Vision Processing', status: 'active', desc: 'Gemini 2.5 Flash analyzing...', icon: Loader2, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
  { id: 3, label: 'Compliance Score', status: 'pending', desc: '92/100 (Excellent)', icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  { id: 4, label: 'Issues Detected', status: 'pending', desc: '3 minor violations found', icon: AlertCircle, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  { id: 5, label: 'Action Plan Generated', status: 'pending', desc: 'Corrective action plan active', icon: Sparkles, color: 'text-violet-400 bg-violet-500/10 border-violet-500/20' }
];

export default function WorkflowPanel() {
  const [activeStep, setActiveStep] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev % 5) + 1);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
      className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-[0_0_50px_rgba(37,99,235,0.05)]"
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Live AI Compliance pipeline</span>
        <div className="flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full text-[9px] font-semibold text-blue-400">
          <span className="w-1 h-1 bg-blue-400 rounded-full animate-ping" />
          Active Sandbox
        </div>
      </div>

      <div className="relative border-l border-white/10 ml-4 pl-6 space-y-6">
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isCompleted = activeStep > step.id || (activeStep === 5 && step.id === 5);
          const isActive = activeStep === step.id;

          return (
            <motion.div
              key={step.id}
              initial={false}
              animate={{
                opacity: isCompleted || isActive ? 1 : 0.35,
                x: isActive ? 4 : 0
              }}
              className="relative group"
            >
              {/* Dot indicator */}
              <div className="absolute -left-[31px] top-1">
                <motion.div
                  animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                    backgroundColor: isCompleted ? '#10b981' : isActive ? '#3b82f6' : '#1f2937'
                  }}
                  transition={{ repeat: isActive ? Infinity : 0, duration: 2 }}
                  className="w-2.5 h-2.5 rounded-full ring-4 ring-[#050816]"
                />
              </div>

              {/* Box container */}
              <div className={`p-4 rounded-2xl border transition-all duration-300 ${
                isActive 
                  ? 'bg-white/[0.04] border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]' 
                  : 'bg-white/[0.01] border-white/[0.04]'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${step.color}`}>
                    {isActive && step.id === 2 ? (
                      <Icon className="w-4 h-4 animate-spin" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">{step.label}</h4>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-none">
                      {isActive ? step.desc : isCompleted ? 'Verification Successful' : 'Queued'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
