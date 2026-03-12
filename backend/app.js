const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
require('dotenv').config();

const logger = require('./utils/logger');

// Route imports
const auditRouter = require('./routes/audit');
const integrityRouter = require('./routes/integrity');
const networkRouter = require('./routes/network');
const passwordRouter = require('./routes/password');
const logsRouter = require('./routes/logs');
const alertsRouter = require('./routes/alerts');
const healthRouter = require('./routes/health');

const app = express();

// CORS — allow frontend dev server
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173'],
  credentials: true,
}));

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// API Routes
app.use('/api/audit', auditRouter);
app.use('/api/integrity', integrityRouter);
app.use('/api/network', networkRouter);
app.use('/api/password', passwordRouter);
app.use('/api/logs', logsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/health', healthRouter);

// Serve React build in production
app.use(express.static(path.join(__dirname, '../Frontend/dist')));
app.get('*', (req, res, next) => {
  // Only serve index.html for non-API routes
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(__dirname, '../Frontend/dist/index.html');
  const fs = require('fs');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).json({ message: 'CyberSec Toolkit API is running. Frontend build not found.' });
  }
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: true, message: `Route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`[${req.method}] ${req.path} — ${err.message}`);
  res.status(err.status || 500).json({
    error: true,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

module.exports = app;
