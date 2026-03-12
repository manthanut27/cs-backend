import { formatTimestamp } from '../../utils/time';
import { Check } from 'lucide-react';
import api from '../../api/client';

export default function ChangeHistoryTable({ changes = [], onUpdate }) {
  const handleAcknowledge = async (changeId) => {
    try {
      await api.patch(`/alerts/${changeId}/acknowledge`);
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to acknowledge:', err);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Change History</h3>
      </div>
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-primary)]/50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">File Path</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Old Hash</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">New Hash</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Detected</th>
              <th className="text-right px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {changes.map((change, i) => (
              <tr key={change.id || i} className="hover:bg-[var(--color-bg-card-hover)] transition-colors">
                <td className="px-4 py-2 font-mono text-[var(--color-text-secondary)] truncate max-w-[200px]">{change.file_path}</td>
                <td className="px-4 py-2 font-mono text-red-400/70 truncate max-w-[120px]">{change.old_hash?.slice(0, 12)}...</td>
                <td className="px-4 py-2 font-mono text-emerald-400/70 truncate max-w-[120px]">{change.new_hash?.slice(0, 12)}...</td>
                <td className="px-4 py-2 text-[var(--color-text-muted)]">{formatTimestamp(change.detected_at)}</td>
                <td className="px-4 py-2 text-right">
                  {!change.acknowledged && (
                    <button
                      onClick={() => handleAcknowledge(change.id)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors"
                    >
                      <Check size={10} /> Dismiss
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
