const express = require('express');
const router = express.Router();
const SystemService = require('../services/SystemService');

// GET /api/audit — Full system security audit
router.get('/', async (req, res, next) => {
  try {
    const audit = await SystemService.getFullAudit();
    res.json(audit);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
