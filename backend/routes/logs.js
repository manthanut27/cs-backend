const express = require('express');
const router = express.Router();
const LogService = require('../services/LogService');

// GET /api/logs — Get recent auth log events
router.get('/', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const severity = req.query.severity || null;
    const data = await LogService.getRecentEvents({ limit, severity });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
