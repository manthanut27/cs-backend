const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const logger = require('../utils/logger');

const ALERTS_FILE = path.join(__dirname, '../data/alerts.json');

// --- Local JSON store helpers ---
function loadAlerts() {
  try {
    return JSON.parse(fs.readFileSync(ALERTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function saveAlerts(data) {
  fs.writeFileSync(ALERTS_FILE, JSON.stringify(data, null, 2));
}

// --- Health score deductions ---
const DEDUCTIONS = {
  brute_force:    { CRITICAL: 25 },
  file_change:    { CRITICAL: 25, HIGH: 10 },
  open_port:      { HIGH: 15 },
  unknown_device: { MEDIUM: 5 },
  failed_login:   { LOW: 2, MEDIUM: 5 },
  sudo_failed:    { HIGH: 10 },
};

/**
 * Create a new alert
 */
async function createAlert({ source, type, severity, title, detail }) {
  const alert = {
    id: uuidv4(),
    source,
    type,
    severity,
    title,
    detail,
    timestamp: new Date().toISOString(),
    acknowledged: false,
  };

  // Save to Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('security_alerts')
        .insert({
          source, type, severity, title, detail,
        })
        .select()
        .single();

      if (!error && data) return data;
    } catch (err) {
      logger.error('Supabase alert insert failed:', err.message);
    }
  }

  // Fallback to local file
  const alerts = loadAlerts();
  alerts.unshift(alert);
  // Keep only last 500 alerts locally
  if (alerts.length > 500) alerts.length = 500;
  saveAlerts(alerts);

  return alert;
}

/**
 * Get alerts with optional filters
 */
async function getAlerts({ limit = 50, unacknowledgedOnly = false } = {}) {
  if (supabase) {
    let query = supabase
      .from('security_alerts')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);

    if (unacknowledgedOnly) query = query.eq('acknowledged', false);
    const { data } = await query;

    if (data) {
      const counts = {
        critical: data.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length,
        high: data.filter(a => a.severity === 'HIGH' && !a.acknowledged).length,
        medium: data.filter(a => a.severity === 'MEDIUM' && !a.acknowledged).length,
        low: data.filter(a => a.severity === 'LOW' && !a.acknowledged).length,
      };
      return { alerts: data, counts };
    }
  }

  // Fallback to local
  let alerts = loadAlerts();
  if (unacknowledgedOnly) alerts = alerts.filter(a => !a.acknowledged);
  alerts = alerts.slice(0, limit);

  const counts = {
    critical: alerts.filter(a => a.severity === 'CRITICAL' && !a.acknowledged).length,
    high: alerts.filter(a => a.severity === 'HIGH' && !a.acknowledged).length,
    medium: alerts.filter(a => a.severity === 'MEDIUM' && !a.acknowledged).length,
    low: alerts.filter(a => a.severity === 'LOW' && !a.acknowledged).length,
  };

  return { alerts, counts };
}

/**
 * Acknowledge a single alert
 */
async function acknowledgeAlert(id) {
  if (supabase) {
    const { error } = await supabase
      .from('security_alerts')
      .update({ acknowledged: true })
      .eq('id', id);
    if (!error) return { success: true, id, acknowledged: true };
  }

  // Local fallback
  const alerts = loadAlerts();
  const alert = alerts.find(a => a.id === id);
  if (alert) {
    alert.acknowledged = true;
    saveAlerts(alerts);
  }
  return { success: true, id, acknowledged: true };
}

/**
 * Acknowledge all alerts
 */
async function acknowledgeAll() {
  if (supabase) {
    const { data } = await supabase
      .from('security_alerts')
      .update({ acknowledged: true })
      .eq('acknowledged', false)
      .select('id');
    return { success: true, acknowledged_count: data?.length || 0 };
  }

  // Local fallback
  const alerts = loadAlerts();
  let count = 0;
  for (const a of alerts) {
    if (!a.acknowledged) { a.acknowledged = true; count++; }
  }
  saveAlerts(alerts);
  return { success: true, acknowledged_count: count };
}

/**
 * Compute system health score based on unacknowledged alerts
 */
async function computeHealthScore() {
  const { alerts } = await getAlerts({ limit: 200, unacknowledgedOnly: true });
  let score = 100;
  for (const alert of alerts) {
    const deduction = DEDUCTIONS[alert.type]?.[alert.severity] ?? 0;
    score -= deduction;
  }
  return Math.max(0, Math.min(100, score));
}

module.exports = { createAlert, getAlerts, acknowledgeAlert, acknowledgeAll, computeHealthScore };
