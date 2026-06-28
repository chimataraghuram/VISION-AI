/**
 * IssueCard Component
 * Displays a single detected compliance issue with title and description.
 */
import { AlertTriangle } from 'lucide-react';

export default function IssueCard({ issue, index }) {
  return (
    <div className="flex gap-4 p-4 bg-red-50 border border-red-100 rounded-xl">
      {/* Icon */}
      <div className="flex-shrink-0 w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
        <AlertTriangle className="w-4 h-4 text-red-600" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0 text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full mt-0.5">
            #{index + 1}
          </span>
          <h4 className="text-sm font-semibold text-red-900 leading-snug">
            {issue.title}
          </h4>
        </div>
        <p className="mt-1.5 text-sm text-red-700 leading-relaxed">
          {issue.description}
        </p>
      </div>
    </div>
  );
}
