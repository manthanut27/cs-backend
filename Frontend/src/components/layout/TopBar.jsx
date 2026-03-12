import { useSecurity } from '../../context/SecurityContext';
import { getHealthLabel } from '../../utils/severity';
import { Bell, Activity } from 'lucide-react';

export default function TopBar({ title }) {
  const { healthScore, totalAlerts } = useSecurity();
  const health = getHealthLabel(healthScore);

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/50 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <Activity size={20} className="text-[var(--color-accent)]" />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{title || 'Dashboard'}</h2>
      </div>

      <div className="flex items-center gap-4">
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
        <button className="relative p-2 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors">
          <Bell size={20} />
          {totalAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-[var(--color-severity-critical)] text-white text-[10px] font-bold flex items-center justify-center px-1">
              {totalAlerts > 99 ? '99+' : totalAlerts}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
