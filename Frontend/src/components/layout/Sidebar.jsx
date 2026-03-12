import { NavLink } from 'react-router-dom';
import { useSecurity } from '../../context/SecurityContext';
import { STATUS_CONFIG } from '../../utils/severity';
import {
  LayoutDashboard, Shield, FileSearch, Wifi,
  KeyRound, ScrollText, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', module: null },
  { to: '/audit', icon: Shield, label: 'System Audit', module: 'system_audit' },
  { to: '/integrity', icon: FileSearch, label: 'File Integrity', module: 'file_integrity' },
  { to: '/network', icon: Wifi, label: 'Network', module: 'network' },
  { to: '/password', icon: KeyRound, label: 'Password', module: 'password' },
  { to: '/logs', icon: ScrollText, label: 'Logs', module: 'log_monitor' },
];

export default function Sidebar() {
  const { moduleStatuses, alerts } = useSecurity();
  const [collapsed, setCollapsed] = useState(false);

  const getAlertCount = (module) => {
    if (!module) return 0;
    return alerts.filter(a => a.source === module && !a.acknowledged).length;
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-40 flex flex-col transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[72px]' : 'w-[240px]'
      }`}
      style={{
        background: 'linear-gradient(180deg, #0f1729 0%, #0a0e17 100%)',
        borderRight: '1px solid var(--color-border)',
      }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--color-border)]">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)' }}>
          <Shield size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in">
            <h1 className="text-sm font-bold text-[var(--color-text-primary)] leading-tight">CyberSec</h1>
            <p className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider">Toolkit</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label, module }) => {
          const status = module ? moduleStatuses[module] : null;
          const statusConfig = status ? STATUS_CONFIG[status] : null;
          const count = getAlertCount(module);

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 relative ${
                  isActive
                    ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[var(--color-accent)]" />
                  )}
                  <Icon size={20} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium truncate flex-1">{label}</span>
                      {count > 0 && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                            statusConfig?.bg || 'bg-blue-500/15'
                          } ${statusConfig?.text || 'text-blue-400'}`}
                        >
                          {count}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && count > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-severity-critical)]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-center h-12 border-t border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-white/5 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
