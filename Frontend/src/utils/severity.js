export const SEVERITY_CONFIG = {
  CRITICAL: { color: '#ef4444', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30', label: 'Critical', icon: '🔴' },
  HIGH:     { color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30', label: 'High', icon: '🟠' },
  MEDIUM:   { color: '#eab308', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Medium', icon: '🟡' },
  LOW:      { color: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Low', icon: '🔵' },
};

export const STATUS_CONFIG = {
  safe:     { color: '#22c55e', bg: 'bg-emerald-500/15', text: 'text-emerald-400', label: 'Secure', icon: '✅' },
  info:     { color: '#3b82f6', bg: 'bg-blue-500/15', text: 'text-blue-400', label: 'Info', icon: 'ℹ️' },
  caution:  { color: '#eab308', bg: 'bg-yellow-500/15', text: 'text-yellow-400', label: 'Caution', icon: '⚠️' },
  warning:  { color: '#f97316', bg: 'bg-orange-500/15', text: 'text-orange-400', label: 'Warning', icon: '🔶' },
  critical: { color: '#ef4444', bg: 'bg-red-500/15', text: 'text-red-400', label: 'Critical', icon: '🔴' },
};

export const HEALTH_CONFIG = [
  { min: 90, label: 'Secure',     color: '#22c55e' },
  { min: 70, label: 'Good',       color: '#84cc16' },
  { min: 50, label: 'At Risk',    color: '#eab308' },
  { min: 25, label: 'Vulnerable', color: '#f97316' },
  { min: 0,  label: 'Critical',   color: '#ef4444' },
];

export function getSeverityConfig(severity) {
  return SEVERITY_CONFIG[severity] || SEVERITY_CONFIG.LOW;
}

export function getHealthLabel(score) {
  return HEALTH_CONFIG.find(h => score >= h.min) || HEALTH_CONFIG[HEALTH_CONFIG.length - 1];
}

export function getModuleStatus(moduleName, alerts = []) {
  const moduleAlerts = alerts.filter(a => a.source === moduleName && !a.acknowledged);
  if (moduleAlerts.some(a => a.severity === 'CRITICAL')) return 'critical';
  if (moduleAlerts.some(a => a.severity === 'HIGH')) return 'warning';
  if (moduleAlerts.some(a => a.severity === 'MEDIUM')) return 'caution';
  if (moduleAlerts.length > 0) return 'info';
  return 'safe';
}
