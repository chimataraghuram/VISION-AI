import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function getScoreColor(score) {
  if (score >= 70) return { ring: '#16a34a', text: 'text-success', label: 'Compliant' };
  if (score >= 40) return { ring: '#f59e0b', text: 'text-warning', label: 'Partial' };
  return { ring: '#ef4444', text: 'text-danger', label: 'Non-Compliant' };
}

export default function CircularScore({ score, size = 180, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const colors = getScoreColor(progress);
  const center = size / 2;

  // Animate the numeric score counter
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = Math.round(progress);
    if (start === end) return;

    const totalDuration = 1000;
    const incrementTime = Math.abs(Math.floor(totalDuration / end));

    const timer = setInterval(() => {
      start += 1;
      setDisplayScore(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [progress]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#f1f5f9"
            strokeWidth={strokeWidth}
          />
          {/* Animated Progress ring */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: circumference - (progress / 100) * circumference }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            strokeLinecap="round"
          />
        </svg>

        {/* Score overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-5xl font-extrabold tracking-tight ${colors.text}`}
          >
            {displayScore}
          </motion.span>
          <span className="text-[10px] font-semibold text-surface-400 uppercase tracking-widest mt-0.5">SCORE</span>
        </div>
      </div>

      <motion.span
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className={`text-xs font-bold ${colors.text} px-3 py-1 rounded-full`}
        style={{ backgroundColor: `${colors.ring}12`, border: `1px solid ${colors.ring}25` }}
      >
        {colors.label}
      </motion.span>
    </div>
  );
}
