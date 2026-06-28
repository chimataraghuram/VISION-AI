/**
 * CircularScore Component
 * SVG-based circular progress ring displaying a compliance score.
 * Color: green ≥70, amber 40-69, red <40
 */

function getScoreColor(score) {
  if (score >= 70) return { ring: '#10b981', text: 'text-emerald-600', label: 'Compliant' };
  if (score >= 40) return { ring: '#f59e0b', text: 'text-amber-600', label: 'Partial' };
  return { ring: '#ef4444', text: 'text-red-600', label: 'Non-Compliant' };
}

export default function CircularScore({ score, size = 180, strokeWidth = 12 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (progress / 100) * circumference;
  const colors = getScoreColor(progress);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
          aria-label={`Compliance score: ${score} out of 100`}
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={colors.ring}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>

        {/* Score text overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-4xl font-bold tabular-nums ${colors.text}`}>
            {Math.round(progress)}
          </span>
          <span className="text-xs font-medium text-surface-500 mt-0.5">/100</span>
        </div>
      </div>

      {/* Status label */}
      <span className={`text-sm font-semibold ${colors.text} bg-opacity-10 px-3 py-1 rounded-full`}
        style={{ backgroundColor: `${colors.ring}15` }}>
        {colors.label}
      </span>
    </div>
  );
}
