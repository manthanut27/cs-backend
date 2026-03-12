import TopBar from '../components/layout/TopBar';
import DeviceTable from '../components/network/DeviceTable';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import EmptyState from '../components/shared/EmptyState';
import { usePolling } from '../hooks/usePolling';
import { RefreshCw, Wifi, Clock } from 'lucide-react';
import { formatTimestamp } from '../utils/time';
import { useState } from 'react';
import api from '../api/client';

export default function NetworkPage() {
  const { data, loading, error, refetch } = usePolling('/network/scan', 120000);
  const [scanning, setScanning] = useState(false);

  const handleForceRescan = async () => {
    setScanning(true);
    try {
      await api.get('/network/scan?force=true');
      await refetch();
    } catch {
      // handled by error state
    } finally {
      setScanning(false);
    }
  };

  return (
    <>
      <TopBar title="Network Monitor" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
            <Clock size={14} />
            Last scan: {data?.scanned_at ? formatTimestamp(data.scanned_at) : '—'}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-card-hover)] transition-colors border border-[var(--color-border)]"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Quick Scan
            </button>
            <button
              onClick={handleForceRescan}
              disabled={scanning}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors"
            >
              <Wifi size={14} className={scanning ? 'animate-pulse' : ''} />
              {scanning ? 'Scanning...' : 'Deep Scan'}
            </button>
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {/* Summary stats */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-[var(--color-accent)]">{data.devices?.length || 0}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Total Devices</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-emerald-400">{data.devices?.filter(d => d.is_trusted).length || 0}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Trusted</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-yellow-400">{data.unknownCount || 0}</p>
              <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-1">Unknown</p>
            </div>
          </div>
        )}

        {loading && !data ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : data?.devices?.length > 0 ? (
          <DeviceTable devices={data.devices} onUpdate={refetch} />
        ) : (
          <EmptyState icon={Wifi} title="No devices found" description="Run a scan to discover devices on your network" />
        )}
      </div>
    </>
  );
}
