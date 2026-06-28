/**
 * RecommendationList Component
 * Displays actionable recommendations as a checklist.
 */
import { CheckCircle2 } from 'lucide-react';

export default function RecommendationList({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <p className="text-sm text-surface-400 italic">No recommendations available.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {recommendations.map((rec, i) => (
        <li key={i} className="flex gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
          <CheckCircle2 className="flex-shrink-0 w-5 h-5 text-emerald-600 mt-0.5" />
          <span className="text-sm text-emerald-900 leading-relaxed">{rec}</span>
        </li>
      ))}
    </ul>
  );
}
