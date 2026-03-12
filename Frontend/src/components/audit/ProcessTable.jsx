import { useState } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

export default function ProcessTable({ processes = [] }) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('cpu');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = processes
    .filter(p => {
      const q = search.toLowerCase();
      return p.command?.toLowerCase().includes(q) || String(p.pid).includes(q) || p.user?.toLowerCase().includes(q);
    })
    .sort((a, b) => {
      const aVal = parseFloat(a[sortField]) || 0;
      const bVal = parseFloat(b[sortField]) || 0;
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Running Processes
          <span className="ml-2 text-[var(--color-text-muted)] font-normal">({processes.length})</span>
        </h3>
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-3 py-1.5 text-xs rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent)] w-44"
          />
        </div>
      </div>
      <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="bg-[var(--color-bg-primary)]/50 sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">PID</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">User</th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium cursor-pointer select-none" onClick={() => toggleSort('cpu')}>
                <span className="flex items-center gap-1">CPU% <SortIcon field="cpu" /></span>
              </th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium cursor-pointer select-none" onClick={() => toggleSort('mem')}>
                <span className="flex items-center gap-1">MEM% <SortIcon field="mem" /></span>
              </th>
              <th className="text-left px-4 py-2.5 text-[var(--color-text-muted)] font-medium">Command</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {filtered.slice(0, 100).map((proc, i) => (
              <tr key={proc.pid || i} className="hover:bg-[var(--color-bg-card-hover)] transition-colors">
                <td className="px-4 py-2 text-[var(--color-text-secondary)] font-mono">{proc.pid}</td>
                <td className="px-4 py-2 text-[var(--color-text-secondary)]">{proc.user}</td>
                <td className="px-4 py-2">
                  <span className={parseFloat(proc.cpu) > 50 ? 'text-[var(--color-severity-high)] font-semibold' : 'text-[var(--color-text-secondary)]'}>
                    {proc.cpu}%
                  </span>
                </td>
                <td className="px-4 py-2">
                  <span className={parseFloat(proc.mem) > 50 ? 'text-[var(--color-severity-high)] font-semibold' : 'text-[var(--color-text-secondary)]'}>
                    {proc.mem}%
                  </span>
                </td>
                <td className="px-4 py-2 text-[var(--color-text-secondary)] font-mono truncate max-w-[300px]">{proc.command}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
