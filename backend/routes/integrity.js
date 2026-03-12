const express = require('express');
const router = express.Router();
const FileService = require('../services/FileService');

// GET /api/integrity/status — Get all monitored files and their status
router.get('/status', async (req, res, next) => {
  try {
    const data = await FileService.getAllFiles();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/integrity/add — Add file to watchlist
router.post('/add', async (req, res, next) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: true, message: 'File path is required' });
    }
    const result = await FileService.addFile(path);
    res.json(result);
  } catch (err) {
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: true, message: err.message });
    }
    next(err);
  }
});

// DELETE /api/integrity/remove — Remove file from watchlist
router.delete('/remove', async (req, res, next) => {
  try {
    const { path } = req.body;
    if (!path) {
      return res.status(400).json({ error: true, message: 'File path is required' });
    }
    const result = await FileService.removeFile(path);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/integrity/history — Get file change history
router.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const data = await FileService.getHistory(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
