import TopBar from '../components/layout/TopBar';
import AddFileForm from '../components/integrity/AddFileForm';
import WatchlistTable from '../components/integrity/WatchlistTable';
import ChangeHistoryTable from '../components/integrity/ChangeHistoryTable';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import EmptyState from '../components/shared/EmptyState';
import { usePolling } from '../hooks/usePolling';
import { FileSearch } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../api/client';

export default function IntegrityPage() {
  const { data, loading, error, refetch } = usePolling('/integrity/status', 30000);
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    api.get('/integrity/history?limit=50')
      .then(res => setChanges(res.changes || []))
      .catch(() => {});
  }, [data]);

  return (
    <>
      <TopBar title="File Integrity Monitor" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        <AddFileForm onFileAdded={refetch} />

        {error && <ErrorBanner message={error} />}

        {loading && !data ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : data?.files?.length > 0 ? (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Files', value: data.summary?.total || 0, color: 'var(--color-accent)' },
                { label: 'Clean', value: data.summary?.clean || 0, color: 'var(--color-severity-safe)' },
                { label: 'Modified', value: data.summary?.modified || 0, color: 'var(--color-severity-critical)' },
                { label: 'Missing', value: data.summary?.missing || 0, color: 'var(--color-severity-medium)' },
              ].map(s => (
                <div key={s.label} className="glass-card p-4 text-center">
                  <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            <WatchlistTable files={data.files} onUpdate={refetch} />
            {changes.length > 0 && <ChangeHistoryTable changes={changes} onUpdate={refetch} />}
          </>
        ) : (
          <EmptyState
            icon={FileSearch}
            title="No files monitored"
            description="Add a file or directory path above to start monitoring"
          />
        )}
      </div>
    </>
  );
}
