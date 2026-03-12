import { Trash2, FileCheck, FileWarning } from 'lucide-react';
import { timeAgo } from '../../utils/time';
import api from '../../api/client';

export default function WatchlistTable({ files = [], onUpdate }) {
  const handleRemove = async (filepath) => {
    try {
      await api.delete('/integrity/remove', { data: { path: filepath } });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to remove:', err);
    }
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Monitored Files
          <span className="ml-2 text-[var(--color-text-muted)] font-normal">({files.length})</span>
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-primary)]/50">
            <tr>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">File Path</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Status</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Last Checked</th>
              <th className="text-right px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {files.map((file, i) => (
              <tr key={file.id || i} className="hover:bg-[var(--color-bg-card-hover)] transition-colors">
                <td className="px-4 py-2.5 font-mono text-[var(--color-text-secondary)] truncate max-w-[300px]">
                  {file.file_path}
                </td>
                <td className="px-4 py-2.5">
                  {file.status === 'modified' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20">
                      <FileWarning size={10} /> Modified
                    </span>
                  ) : file.status === 'missing' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
                      Missing
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <FileCheck size={10} /> Clean
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-[var(--color-text-muted)]">
                  {timeAgo(file.last_checked)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => handleRemove(file.file_path)}
                    className="p-1.5 rounded-md text-[var(--color-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Remove from watchlist"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
