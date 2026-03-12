import { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import api from '../../api/client';

export default function AddFileForm() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await api.post('/integrity/scan-upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(res);
      setFile(null);
      // Clear the file input element
      if (e.target.reset) e.target.reset();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-4 space-y-3">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <label className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-sm text-[var(--color-text-secondary)] cursor-pointer hover:border-[var(--color-accent)] transition-colors">
            <FolderPlus size={16} className="text-[var(--color-text-muted)]" />
            <span className="truncate">
              {file ? file.name : 'Choose a file to scan...'}
            </span>
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0] || null;
                setFile(selected);
              }}
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={loading || !file}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-glow)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? 'Scanning...' : 'Scan File'}
        </button>
      </form>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {result && (
        <div className="mt-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]/60 p-3 text-xs space-y-1">
          <p className="text-[var(--color-text-primary)] font-semibold">Scan result</p>
          <p className="text-[var(--color-text-secondary)]">
            <span className="font-medium">File:</span> {result.filename} ({result.mimetype})
          </p>
          <p className="text-[var(--color-text-secondary)]">
            <span className="font-medium">Size:</span> {(result.size / 1024).toFixed(1)} KB
          </p>
          <p className="text-[var(--color-text-secondary)] break-all">
            <span className="font-medium">SHA-256:</span> {result.sha256}
          </p>
          <p className="text-[var(--color-text-secondary)]">
            <span className="font-medium">Severity:</span> {result.severity}
          </p>
          <p className="text-[var(--color-text-muted)]">
            {result.verdict}
          </p>
        </div>
      )}
    </div>
  );
}
