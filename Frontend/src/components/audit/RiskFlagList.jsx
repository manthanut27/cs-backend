import { AlertTriangle, Shield } from 'lucide-react';

export default function RiskFlagList({ riskFlags = [] }) {
  if (riskFlags.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Risk Flags</h3>
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <Shield size={16} />
          <span>No risks detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5">
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">
        Risk Flags
        <span className="ml-2 text-red-400 font-normal">({riskFlags.length})</span>
      </h3>
      <div className="space-y-2">
        {riskFlags.map((flag, i) => (
          <div
            key={i}
            className={`flex items-start gap-3 p-3 rounded-lg border ${
              flag.level === 'HIGH' || flag.level === 'CRITICAL'
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-yellow-500/5 border-yellow-500/20'
            }`}
          >
            <AlertTriangle
              size={16}
              className={`flex-shrink-0 mt-0.5 ${
                flag.level === 'HIGH' || flag.level === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'
              }`}
            />
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${
                flag.level === 'HIGH' || flag.level === 'CRITICAL' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {flag.level}
              </span>
              <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{flag.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
