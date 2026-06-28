/**
 * ErrorAlert Component
 * Dismissible error/warning/info alert banner.
 */
import { AlertCircle, XCircle, CheckCircle, Info, X } from 'lucide-react';
import { useState } from 'react';

const VARIANTS = {
  error:   { bg: 'bg-red-50',    border: 'border-red-200',   text: 'text-red-800',   icon: XCircle,       iconColor: 'text-red-500'   },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200', text: 'text-amber-800', icon: AlertCircle,   iconColor: 'text-amber-500' },
  success: { bg: 'bg-emerald-50',border: 'border-emerald-200',text:'text-emerald-800',icon: CheckCircle,  iconColor: 'text-emerald-500'},
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',  text: 'text-blue-800',  icon: Info,          iconColor: 'text-blue-500'  },
};

export default function ErrorAlert({ message, type = 'error', dismissible = true, onDismiss }) {
  const [visible, setVisible] = useState(true);

  if (!visible || !message) return null;

  const v = VARIANTS[type] || VARIANTS.error;
  const Icon = v.icon;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div className={`flex items-start gap-3 p-4 rounded-xl border ${v.bg} ${v.border} ${v.text}`}
      role="alert">
      <Icon className={`flex-shrink-0 w-5 h-5 mt-0.5 ${v.iconColor}`} />
      <p className="flex-1 text-sm leading-relaxed">{message}</p>
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 hover:opacity-70 transition-opacity"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
