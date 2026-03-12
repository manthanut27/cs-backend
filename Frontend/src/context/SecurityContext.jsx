import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import api from '../api/client';
import { useRealtimeAlerts } from '../hooks/useRealtimeAlerts';
import { getModuleStatus } from '../utils/severity';

const SecurityContext = createContext(null);

export function SecurityProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [healthScore, setHealthScore] = useState(100);
  const [alertCounts, setAlertCounts] = useState({ critical: 0, high: 0, medium: 0, low: 0 });

  const fetchAlerts = useCallback(async () => {
    try {
      const data = await api.get('/alerts?unacknowledged=true&limit=50');
      setAlerts(data.alerts || []);
      setAlertCounts(data.counts || { critical: 0, high: 0, medium: 0, low: 0 });
    } catch {
      // Backend may not be running yet
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.get('/health');
      if (data.health_score !== undefined) setHealthScore(data.health_score);
    } catch {
      // Backend may not be running
    }
  }, []);

  const acknowledgeAlert = useCallback(async (alertId) => {
    try {
      await api.patch(`/alerts/${alertId}/acknowledge`);
      setAlerts(prev => prev.filter(a => a.id !== alertId));
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  }, []);

  const acknowledgeAll = useCallback(async () => {
    try {
      await api.patch('/alerts/acknowledge-all');
      setAlerts([]);
      setAlertCounts({ critical: 0, high: 0, medium: 0, low: 0 });
    } catch (err) {
      console.error('Failed to acknowledge all alerts:', err);
    }
  }, []);

  const handleNewAlert = useCallback((newAlert) => {
    setAlerts(prev => [newAlert, ...prev]);
  }, []);

  useRealtimeAlerts(handleNewAlert);

  useEffect(() => {
    fetchAlerts();
    fetchHealth();
    const interval = setInterval(() => {
      fetchAlerts();
      fetchHealth();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchAlerts, fetchHealth]);

  const moduleStatuses = {
    system_audit: getModuleStatus('system_audit', alerts),
    file_integrity: getModuleStatus('file_integrity', alerts),
    network: getModuleStatus('network', alerts),
    password: getModuleStatus('password', alerts),
    log_monitor: getModuleStatus('log_monitor', alerts),
  };

  const totalAlerts = alerts.filter(a => !a.acknowledged).length;

  return (
    <SecurityContext.Provider value={{
      alerts, healthScore, alertCounts, moduleStatuses, totalAlerts,
      acknowledgeAlert, acknowledgeAll, fetchAlerts, fetchHealth,
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

export default SecurityContext;
