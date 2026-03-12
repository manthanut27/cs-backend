const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

const app = express();

// view engine setup (kept for default index page if needed)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Allow the frontend (typically on a different port) to call the API
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
  }),
);

// Static assets if needed
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/', indexRouter);
app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  // For unknown API routes, return JSON; otherwise fall back to default 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: true,
      message: 'API route not found',
    });
  }
  next(createError(404));
});

// error handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;

  if (req.path.startsWith('/api/')) {
    // JSON error for API consumers
    return res.status(status).json({
      error: true,
      message: err.message || 'Unexpected server error',
    });
  }

  // Render error page for non-API routes
  res.status(status);
  res.render('error', {
    message: err.message,
    error: req.app.get('env') === 'development' ? err : {},
  });
});

module.exports = app;

