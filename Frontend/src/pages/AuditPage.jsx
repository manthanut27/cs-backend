import TopBar from '../components/layout/TopBar';
import ProcessTable from '../components/audit/ProcessTable';
import PortTable from '../components/audit/PortTable';
import RiskFlagList from '../components/audit/RiskFlagList';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import { usePolling } from '../hooks/usePolling';
import { RefreshCw, Clock } from 'lucide-react';
import { formatTimestamp } from '../utils/time';

export default function AuditPage() {
  const { data, loading, error, refetch } = usePolling('/audit', 60000);

  return (
    <>
      <TopBar title="System Security Audit" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Clock size={14} />
            Last scan: {data?.timestamp ? formatTimestamp(data.timestamp) : '—'}
          </div>
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {error && <ErrorBanner message={error} />}

        {loading && !data ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : (
          <>
            <RiskFlagList riskFlags={data?.riskFlags || []} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <ProcessTable processes={data?.processes || []} />
              <PortTable ports={data?.ports || []} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
