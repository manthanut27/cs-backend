import { useSecurity } from '../../context/SecurityContext';
import SeverityBadge from '../shared/SeverityBadge';
import { timeAgo } from '../../utils/time';
import { CheckCheck } from 'lucide-react';
import EmptyState from '../shared/EmptyState';

export default function AlertFeed() {
  const { alerts, acknowledgeAlert, acknowledgeAll } = useSecurity();

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Live Alert Feed
        </h3>
        {alerts.length > 0 && (
          <button
            onClick={acknowledgeAll}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors"
          >
            <CheckCheck size={14} />
            Dismiss All
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <EmptyState title="All clear" description="No active alerts at this time" />
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
          {alerts.slice(0, 20).map((alert, i) => (
            <div
              key={alert.id || i}
              className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)]/50 hover:bg-[var(--color-bg-card-hover)] transition-colors animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <SeverityBadge severity={alert.severity} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                  {alert.title}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
                  {alert.detail}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {timeAgo(alert.timestamp)}
                </span>
                <button
                  onClick={() => acknowledgeAlert(alert.id)}
                  className="text-[10px] px-1.5 py-0.5 rounded text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/10 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
