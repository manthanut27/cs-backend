import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export function useRealtimeAlerts(onNewAlert) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('security-alerts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'security_alerts' },
        (payload) => {
          if (onNewAlert) onNewAlert(payload.new);
        }
      )
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewAlert]);

  return { connected };
}

export default useRealtimeAlerts;
