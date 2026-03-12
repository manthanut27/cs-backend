import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import api from '../../api/client';

export default function AddFileForm({ onFileAdded }) {
  const [path, setPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!path.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/integrity/add', { path: path.trim() });
      setPath('');
      if (onFileAdded) onFileAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <FolderPlus size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Enter file or directory path to monitor..."
            value={path}
            onChange={e => setPath(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] transition-colors"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !path.trim()}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-glow)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? 'Adding...' : '+ Add File'}
        </button>
      </form>
      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
