const express = require('express');
const router = express.Router();
const NetworkService = require('../services/NetworkService');

// GET /api/network/scan — Scan and return all network devices
router.get('/scan', async (req, res, next) => {
  try {
    const data = await NetworkService.getDevices();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/network/trust — Mark a device as trusted
router.patch('/trust', async (req, res, next) => {
  try {
    const { mac_address } = req.body;
    if (!mac_address) {
      return res.status(400).json({ error: true, message: 'mac_address is required' });
    }
    const result = await NetworkService.trustDevice(mac_address);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
