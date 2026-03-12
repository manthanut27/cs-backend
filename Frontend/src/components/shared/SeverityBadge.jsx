import { getSeverityConfig } from '../../utils/severity';

export default function SeverityBadge({ severity, className = '' }) {
  const config = getSeverityConfig(severity);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${config.bg} ${config.text} ${config.border} border ${className}`}>
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
