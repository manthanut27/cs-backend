import TopBar from '../components/layout/TopBar';
import LogEventTable from '../components/logs/LogEventTable';
import BruteForceAlert from '../components/logs/BruteForceAlert';
import LoadingSpinner from '../components/shared/LoadingSpinner';
import ErrorBanner from '../components/shared/ErrorBanner';
import EmptyState from '../components/shared/EmptyState';
import { usePolling } from '../hooks/usePolling';
import { ScrollText, Filter } from 'lucide-react';
import { useState } from 'react';

const SEVERITY_FILTERS = ['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export default function LogsPage() {
  const { data, loading, error } = usePolling('/logs?limit=100', 15000);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const events = data?.events || [];
  const filtered = severityFilter === 'ALL'
    ? events
    : events.filter(e => e.severity === severityFilter);

  const summary = data?.summary || {};

  return (
    <>
      <TopBar title="Security Log Monitor" />
      <div className="flex-1 p-6 space-y-5 overflow-y-auto">
        {/* Brute force banner */}
        <BruteForceAlert events={events} />

        {/* Summary stats */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: summary.total || 0, color: 'var(--color-accent)' },
              { label: 'Critical', value: summary.critical || 0, color: 'var(--color-severity-critical)' },
              { label: 'High', value: summary.high || 0, color: 'var(--color-severity-high)' },
              { label: 'Medium', value: summary.medium || 0, color: 'var(--color-severity-medium)' },
              { label: 'Low', value: summary.low || 0, color: 'var(--color-severity-low)' },
            ].map(s => (
              <div key={s.label} className="glass-card p-3 text-center">
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Severity filter */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-[var(--color-text-muted)]" />
          <div className="flex gap-1">
            {SEVERITY_FILTERS.map(sev => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                  severityFilter === sev
                    ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)] border border-[var(--color-accent)]/30'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-white/5 border border-transparent'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>

        {error && <ErrorBanner message={error} />}

        {loading && !data ? (
          <LoadingSpinner size="lg" className="py-20" />
        ) : filtered.length > 0 ? (
          <LogEventTable events={filtered} />
        ) : (
          <EmptyState icon={ScrollText} title="No log events" description="No security events match your filters" />
        )}
      </div>
    </>
  );
}
