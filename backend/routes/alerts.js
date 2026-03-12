const express = require('express');
const router = express.Router();
const AlertService = require('../services/AlertService');

// GET /api/alerts — Get all alerts
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const unacknowledgedOnly = req.query.unacknowledged === 'true';
    const data = await AlertService.getAlerts({ limit, unacknowledgedOnly });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/:id/acknowledge — Acknowledge a single alert
router.patch('/:id/acknowledge', async (req, res, next) => {
  try {
    const result = await AlertService.acknowledgeAlert(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/acknowledge-all — Acknowledge all alerts
router.patch('/acknowledge-all', async (req, res, next) => {
  try {
    const result = await AlertService.acknowledgeAll();
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
