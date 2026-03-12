import { useState } from 'react';
import { useSecurity } from '../../context/SecurityContext';
import { getHealthLabel } from '../../utils/severity';
import { Bell, Activity } from 'lucide-react';

export default function TopBar({ title }) {
  const {
    healthScore,
    totalAlerts,
    alerts,
    acknowledgeAlert,
    acknowledgeAll,
  } = useSecurity();
  const health = getHealthLabel(healthScore);
  const [open, setOpen] = useState(false);

  const hasAlerts = totalAlerts > 0;

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Activity size={20} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title || 'Dashboard'}</h2>
      </div>

      <div className="relative flex items-center gap-4">
        {/* Health Score pill */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: `${health.color}15`,
            color: health.color,
            border: `1px solid ${health.color}30`,
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ background: health.color }} />
          {healthScore}% {health.label}
        </div>

        {/* Alert button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors"
        >
          <Bell size={20} />
          {hasAlerts && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--color-severity-critical)] text-white text-[10px] font-bold flex items-center justify-center px-1">
              {totalAlerts > 99 ? '99+' : totalAlerts}
            </span>
          )}
        </button>

        {/* Alerts dropdown */}
        {open && (
          <div className="absolute right-0 top-11 w-80 max-h-[70vh] overflow-y-auto glass-card border border-[var(--color-border)] bg-[var(--color-bg-primary)]/95 shadow-xl rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                {hasAlerts ? 'Active alerts' : 'No active alerts'}
              </p>
              {hasAlerts && (
                <button
                  type="button"
                  onClick={acknowledgeAll}
                  className="text-[10px] font-medium text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
                >
                  Mark all read
                </button>
              )}
            </div>

            {hasAlerts && (
              <ul className="space-y-1">
                {alerts
                  .filter((a) => !a.acknowledged)
                  .slice(0, 10)
                  .map((alert) => (
                    <li
                      key={alert.id}
                      className="flex items-start justify-between gap-2 px-2 py-1.5 rounded-lg bg-[var(--color-bg-secondary)]/70"
                    >
                      <div>
                        <p className="text-[11px] font-semibold text-[var(--color-text-primary)]">
                          {alert.title || alert.type}
                        </p>
                        {alert.detail && (
                          <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-2">
                            {alert.detail}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-[10px] font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-glow)]"
                      >
                        Dismiss
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
