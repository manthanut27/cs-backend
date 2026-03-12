import { Link } from 'react-router-dom';
import { STATUS_CONFIG } from '../../utils/severity';

export default function ModuleCard({ title, icon: Icon, status = 'safe', alertCount = 0, to, description }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.safe;

  return (
    <Link
      to={to}
      className="glass-card p-5 flex flex-col gap-3 group cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
      style={{ '--hover-glow': config.color }}
    >
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
          style={{ background: `${config.color}15`, border: `1px solid ${config.color}25` }}
        >
          <Icon size={20} style={{ color: config.color }} />
        </div>
        {alertCount > 0 ? (
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${config.bg} ${config.text}`}
          >
            {alertCount} alert{alertCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
            ✅ OK
          </span>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">{title}</h3>
        <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">{description}</p>
      </div>

      <div className="mt-auto pt-2 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: config.color }} />
          <span className="text-[11px] font-medium" style={{ color: config.color }}>{config.label}</span>
        </div>
      </div>
    </Link>
  );
}
