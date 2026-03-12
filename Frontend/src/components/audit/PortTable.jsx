export default function PortTable({ ports = [] }) {
  const riskyPorts = [21, 23, 445, 3389, 5900];

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)]">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Open Ports
          <span className="ml-2 text-[var(--color-text-muted)] font-normal">({ports.length})</span>
        </h3>
      </div>
      <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-primary)]/50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Port</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Protocol</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">State</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Risk</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {ports.map((port, i) => {
              const isRisky = riskyPorts.includes(port.port);
              return (
                <tr key={i} className={`hover:bg-[var(--color-bg-card-hover)] transition-colors ${isRisky ? 'bg-red-500/5' : ''}`}>
                  <td className="px-4 py-2 font-mono text-[var(--color-text-secondary)]">{port.port}</td>
                  <td className="px-4 py-2 text-[var(--color-text-secondary)] uppercase">{port.protocol}</td>
                  <td className="px-4 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      port.state === 'LISTEN' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-blue-500/15 text-blue-400'
                    }`}>
                      {port.state}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    {isRisky ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-400">⚠ Risky</span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
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
