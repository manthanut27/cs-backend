import TopBar from '../components/layout/TopBar';
import ModuleCard from '../components/dashboard/ModuleCard';
import HealthScore from '../components/dashboard/HealthScore';
import AlertFeed from '../components/dashboard/AlertFeed';
import { useSecurity } from '../context/SecurityContext';
import { Shield, FileSearch, Wifi, KeyRound, ScrollText } from 'lucide-react';

const modules = [
  { key: 'system_audit', title: 'System Audit', icon: Shield, to: '/audit', description: 'Running processes, open ports, active services' },
  { key: 'file_integrity', title: 'File Integrity', icon: FileSearch, to: '/integrity', description: 'Monitored file changes and hash verification' },
  { key: 'network', title: 'Network Monitor', icon: Wifi, to: '/network', description: 'Connected devices and unknown device detection' },
  { key: 'password', title: 'Password Checker', icon: KeyRound, to: '/password', description: 'Password strength analysis and suggestions' },
  { key: 'log_monitor', title: 'Security Logs', icon: ScrollText, to: '/logs', description: 'Authentication events and brute force detection' },
];

export default function DashboardPage() {
  const { healthScore, moduleStatuses, alerts } = useSecurity();

  const getAlertCount = (module) =>
    alerts.filter(a => a.source === module && !a.acknowledged).length;

  return (
    <>
      <TopBar title="Dashboard" />
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Top row: Health Score + Module Cards */}
        <div className="grid grid-cols-12 gap-5">
          {/* Health Score */}
          <div className="col-span-12 lg:col-span-3">
            <HealthScore score={healthScore} />
          </div>

          {/* Module Cards */}
          <div className="col-span-12 lg:col-span-9">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {modules.map(m => (
                <ModuleCard
                  key={m.key}
                  title={m.title}
                  icon={m.icon}
                  to={m.to}
                  description={m.description}
                  status={moduleStatuses[m.key]}
                  alertCount={getAlertCount(m.key)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Alert Feed */}
        <AlertFeed />
      </div>
    </>
  );
}
