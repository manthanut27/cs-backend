const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const supabase = require('../lib/supabase');
const AlertService = require('./AlertService');
const { broadcast } = require('../ws/WebSocketServer');
const logger = require('../utils/logger');

const PATTERNS = {
  failedLogin: { regex: /Failed password for .* from ([\d.]+)/, severity: 'MEDIUM' },
  invalidUser: { regex: /Invalid user (\w+) from ([\d.]+)/, severity: 'MEDIUM' },
  bruteForce:  { regex: /authentication failure/i, severity: 'HIGH' },
  sudoFailed:  { regex: /sudo.*FAILED/, severity: 'HIGH' },
};

// Track failed attempts per IP for brute force detection
const failureTracker = {};

// In-memory event buffer (last 200 events)
let eventBuffer = [];
const MAX_BUFFER = 200;

/**
 * Process a single log line
 */
async function processLogLine(line) {
  for (const [type, { regex, severity }] of Object.entries(PATTERNS)) {
    if (regex.test(line)) {
      const match = line.match(regex);
      const sourceIp = match?.[1] || null;
      const username = match?.[2] || (type === 'invalidUser' ? match?.[1] : null);

      const event = {
        event_type: type,
        source_ip: sourceIp,
        username,
        severity,
        raw_line: line,
        detected_at: new Date().toISOString(),
      };

      // Add to buffer
      eventBuffer.unshift(event);
      if (eventBuffer.length > MAX_BUFFER) eventBuffer.pop();

      // Insert into Supabase
      if (supabase) {
        try {
          await supabase.from('auth_log_events').insert(event);
        } catch (err) {
          logger.error('Failed to insert log event:', err.message);
        }
      }

      // Brute force detection — 5+ failures from same IP in 60s
      if (sourceIp) {
        const now = Date.now();
        if (!failureTracker[sourceIp]) failureTracker[sourceIp] = [];
        failureTracker[sourceIp].push(now);
        failureTracker[sourceIp] = failureTracker[sourceIp].filter(t => now - t < 60000);

        if (failureTracker[sourceIp].length >= 5) {
          const alertData = {
            source: 'log_monitor',
            type: 'brute_force',
            severity: 'CRITICAL',
            title: 'Brute Force Attack Detected',
            detail: `${failureTracker[sourceIp].length} failed logins from ${sourceIp} in 60s`,
          };

          await AlertService.createAlert(alertData);
          broadcast('log_alert', {
            type: 'bruteForce',
            ip: sourceIp,
            attempts: failureTracker[sourceIp].length,
            severity: 'CRITICAL',
          });

          // Reset tracker for this IP
          failureTracker[sourceIp] = [];
          logger.warn(`Brute force detected from ${sourceIp}`);
        }
      }

      break; // Only match first pattern
    }
  }
}

/**
 * Start tailing the system auth log
 */
function startLogTail() {
  const platform = process.platform;

  if (platform === 'win32') {
    // Windows: Use PowerShell to read Security event log periodically
    logger.info('Windows detected — using PowerShell event log polling');
    setInterval(async () => {
      try {
        exec(
          'powershell -Command "Get-WinEvent -LogName Security -MaxEvents 10 | Select-Object -Property TimeCreated,Id,Message | ConvertTo-Json"',
          { timeout: 15000 },
          async (err, stdout) => {
            if (err) return;
            try {
              const events = JSON.parse(stdout);
              const eventList = Array.isArray(events) ? events : [events];
              for (const evt of eventList) {
                if (evt.Id === 4625) { // Failed logon
                  await processLogLine(`Failed password for user from ${evt.Message?.match(/Source Network Address:\s*([\d.]+)/)?.[1] || 'unknown'}`);
                }
              }
            } catch {
              // JSON parse may fail
            }
          }
        );
      } catch (err) {
        logger.debug('Windows event log check skipped:', err.message);
      }
    }, 30000);
  } else {
    // Linux/macOS: Try to tail auth.log
    const logPath = process.env.LOG_FILE_PATH || '/var/log/auth.log';
    if (!fs.existsSync(logPath)) {
      logger.warn(`Log file not found: ${logPath} — log monitoring disabled`);
      return;
    }

    try {
      const { Tail } = require('tail');
      const tail = new Tail(logPath, { fromBeginning: false });
      tail.on('line', processLogLine);
      tail.on('error', (err) => logger.error('Log tail error:', err.message));
      logger.info(`Tailing log: ${logPath}`);
    } catch (err) {
      logger.warn('Failed to start log tail:', err.message);
    }
  }
}

/**
 * Get recent log events
 */
async function getRecentEvents({ limit = 100, severity = null } = {}) {
  // Try Supabase
  if (supabase) {
    let query = supabase
      .from('auth_log_events')
      .select('*')
      .order('detected_at', { ascending: false })
      .limit(limit);

    if (severity) query = query.eq('severity', severity);

    const { data } = await query;
    if (data) {
      const events = data;
      const summary = {
        total: events.length,
        critical: events.filter(e => e.severity === 'CRITICAL').length,
        high: events.filter(e => e.severity === 'HIGH').length,
        medium: events.filter(e => e.severity === 'MEDIUM').length,
        low: events.filter(e => e.severity === 'LOW').length,
      };
      return { events, summary };
    }
  }

  // Fallback to memory buffer
  let events = eventBuffer.slice(0, limit);
  if (severity) events = events.filter(e => e.severity === severity);

  const summary = {
    total: events.length,
    critical: events.filter(e => e.severity === 'CRITICAL').length,
    high: events.filter(e => e.severity === 'HIGH').length,
    medium: events.filter(e => e.severity === 'MEDIUM').length,
    low: events.filter(e => e.severity === 'LOW').length,
  };

  return { events, summary };
}

module.exports = { startLogTail, getRecentEvents, processLogLine };
