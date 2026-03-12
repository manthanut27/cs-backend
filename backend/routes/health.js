const express = require('express');
const router = express.Router();
const AlertService = require('../services/AlertService');
const os = require('os');

// GET /api/health — System health check
router.get('/', async (req, res) => {
  try {
    const healthScore = await AlertService.computeHealthScore();
    const { counts } = await AlertService.getAlerts({ limit: 200, unacknowledgedOnly: true });

    // Module statuses based on unacknowledged alerts
    const moduleStatuses = {};
    const alertsBySource = {};

    const { alerts } = await AlertService.getAlerts({ limit: 200, unacknowledgedOnly: true });
    for (const alert of alerts) {
      if (!alertsBySource[alert.source]) alertsBySource[alert.source] = [];
      alertsBySource[alert.source].push(alert);
    }

    const moduleMap = {
      audit: 'system_audit',
      file_integrity: 'file_integrity',
      network: 'network',
      log_monitor: 'log_monitor',
    };

    for (const [source, key] of Object.entries(moduleMap)) {
      const sourceAlerts = alertsBySource[source] || [];
      if (sourceAlerts.some(a => a.severity === 'CRITICAL')) {
        moduleStatuses[key] = 'critical';
      } else if (sourceAlerts.some(a => a.severity === 'HIGH')) {
        moduleStatuses[key] = 'warning';
      } else if (sourceAlerts.length > 0) {
        moduleStatuses[key] = 'info';
      } else {
        moduleStatuses[key] = 'safe';
      }
    }
    moduleStatuses['password'] = 'safe'; // Password module always 'safe'

    res.json({
      status: 'ok',
      uptime: process.uptime(),
      hostname: os.hostname(),
      platform: os.platform(),
      healthScore,
      alertCounts: counts,
      moduleStatuses,
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
