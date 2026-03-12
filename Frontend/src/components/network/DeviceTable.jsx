import TrustButton from './TrustButton';
import { timeAgo } from '../../utils/time';
import { Monitor, Router, HardDrive, HelpCircle } from 'lucide-react';

const getDeviceIcon = (hostname) => {
  if (!hostname || hostname === 'unknown') return HelpCircle;
  if (hostname.toLowerCase().includes('router') || hostname.toLowerCase().includes('gateway')) return Router;
  if (hostname.toLowerCase().includes('server')) return HardDrive;
  return Monitor;
};

export default function DeviceTable({ devices = [], onUpdate }) {
  const unknownCount = devices.filter(d => !d.is_trusted).length;

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Connected Devices
          <span className="ml-2 text-[var(--color-text-muted)] font-normal">({devices.length})</span>
        </h3>
        {unknownCount > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/15 text-yellow-400 border border-yellow-500/20">
            {unknownCount} unknown
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-primary)]/50">
            <tr>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Device</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">IP Address</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">MAC Address</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Last Seen</th>
              <th className="text-right px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Trust</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {devices.map((device, i) => {
              const Icon = getDeviceIcon(device.hostname);
              return (
                <tr key={i} className={`hover:bg-[var(--color-bg-card-hover)] transition-colors ${!device.is_trusted ? 'bg-yellow-500/3' : ''}`}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Icon size={14} className={device.is_trusted ? 'text-[var(--color-text-muted)]' : 'text-yellow-400'} />
                      <span className="text-[var(--color-text-secondary)]">{device.hostname || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-[var(--color-text-secondary)]">{device.ip_address}</td>
                  <td className="px-4 py-2.5 font-mono text-[var(--color-text-muted)]">{device.mac_address}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-muted)]">{timeAgo(device.last_seen)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <TrustButton macAddress={device.mac_address} isTrusted={device.is_trusted} onUpdate={onUpdate} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
