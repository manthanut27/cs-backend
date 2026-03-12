import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export default function ErrorBanner({ message, onDismiss }) {
  const [visible, setVisible] = useState(true);

  if (!visible || !message) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 animate-slide-in">
      <AlertTriangle size={18} className="flex-shrink-0" />
      <p className="text-sm flex-1">{message}</p>
      <button
        onClick={handleDismiss}
        className="p-1 rounded hover:bg-red-500/20 transition-colors"
      >
        <X size={14} />
      </button>
    </div>
  );
}
