/**
 * LoadingSpinner Component
 * Full-screen or inline loading spinner with optional message.
 */
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
        <p className="text-sm font-medium text-surface-600">{message}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 py-8 justify-center">
      <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      <span className="text-sm text-surface-500">{message}</span>
    </div>
  );
}
