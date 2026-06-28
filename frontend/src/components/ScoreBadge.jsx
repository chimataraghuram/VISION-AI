/**
 * ScoreBadge Component
 * Color-coded score badge for tables and lists.
 */
export default function ScoreBadge({ score }) {
  const s = Math.round(score);
  let classes = '';
  let label = '';

  if (s >= 80) {
    classes = 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200';
    label = 'Excellent';
  } else if (s >= 60) {
    classes = 'bg-blue-100 text-blue-700 ring-1 ring-blue-200';
    label = 'Good';
  } else if (s >= 40) {
    classes = 'bg-amber-100 text-amber-700 ring-1 ring-amber-200';
    label = 'Fair';
  } else {
    classes = 'bg-red-100 text-red-700 ring-1 ring-red-200';
    label = 'Poor';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${classes}`}>
      <span className="tabular-nums font-bold">{s}</span>
      <span className="opacity-75">{label}</span>
    </span>
  );
}
