const express = require('express');
const router = express.Router();
const PasswordService = require('../services/PasswordService');

// POST /api/password/check — Analyze password strength
router.post('/check', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: true, message: 'Password is required' });
  }
  const result = PasswordService.analyzePassword(password);
  // Password is NOT logged or stored anywhere
  res.json(result);
});

module.exports = router;
