import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield, Eye, AlertTriangle, FileText, Mic } from 'lucide-react';

const STEPS = [
  { text: 'Detecting visual objects & context', icon: Eye },
  { text: 'Checking workspace compliance regulations', icon: Shield },
  { text: 'Evaluating safety risks & hazards', icon: AlertTriangle },
  { text: 'Generating final compliance report', icon: FileText }
];

export default function AILoader() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const intervals = [2500, 3000, 3500]; // Duration for each step
    let timer;

    const run = (index) => {
      if (index < STEPS.length - 1) {
        timer = setTimeout(() => {
          setCurrentStep(index + 1);
          run(index + 1);
        }, intervals[index] || 3000);
      }
    };

    run(0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-surface-50/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        className="bg-white border border-surface-200 shadow-2xl rounded-3xl p-8 max-w-md w-full text-center flex flex-col items-center gap-6"
      >
        {/* Animated robot ring */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
            className="absolute inset-0 border-4 border-dashed border-primary-500 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center"
          >
            <Shield className="w-8 h-8 text-primary-600" />
          </motion.div>
        </div>

        <div>
          <h3 className="text-xl font-bold text-surface-900">VisionAI is analyzing</h3>
          <p className="text-sm text-surface-500 mt-1">Evaluating room safety against regulations</p>
        </div>

        {/* Step checklist */}
        <div className="w-full space-y-3.5 text-left border-t border-surface-100 pt-5">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isDone = currentStep > idx;
            const isActive = currentStep === idx;

            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.15 }}
                className={`flex items-center gap-3 py-1.5 transition-colors duration-200 ${
                  isDone || isActive ? 'text-surface-800' : 'text-surface-400'
                }`}
              >
                {isDone ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex-shrink-0"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                  </motion.div>
                ) : isActive ? (
                  <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 bg-primary-500 rounded-full animate-ping" />
                  </div>
                ) : (
                  <Icon className="w-5 h-5 flex-shrink-0 opacity-60" />
                )}
                <span className={`text-sm font-medium ${isActive ? 'text-primary-600 font-semibold' : ''}`}>
                  {step.text}
                </span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
