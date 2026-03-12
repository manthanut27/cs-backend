// Quick startup test — identifies which module fails to load
const modules = [
  ['dotenv', () => require('dotenv').config()],
  ['express', () => require('express')],
  ['cors', () => require('cors')],
  ['morgan', () => require('morgan')],
  ['uuid', () => require('uuid')],
  ['ws', () => require('ws')],
  ['zxcvbn', () => require('zxcvbn')],
  ['systeminformation', () => require('systeminformation')],
  ['chokidar', () => require('chokidar')],
  ['utils/logger', () => require('./utils/logger')],
  ['utils/riskRules', () => require('./utils/riskRules')],
  ['lib/supabase', () => require('./lib/supabase')],
  ['ws/WebSocketServer', () => require('./ws/WebSocketServer')],
  ['services/AlertService', () => require('./services/AlertService')],
  ['services/SystemService', () => require('./services/SystemService')],
  ['services/PasswordService', () => require('./services/PasswordService')],
  ['services/FileService', () => require('./services/FileService')],
  ['services/NetworkService', () => require('./services/NetworkService')],
  ['services/LogService', () => require('./services/LogService')],
  ['routes/health', () => require('./routes/health')],
  ['routes/audit', () => require('./routes/audit')],
  ['routes/integrity', () => require('./routes/integrity')],
  ['routes/network', () => require('./routes/network')],
  ['routes/password', () => require('./routes/password')],
  ['routes/logs', () => require('./routes/logs')],
  ['routes/alerts', () => require('./routes/alerts')],
  ['app.js', () => require('./app')],
];

console.log('=== Backend Module Test ===');
for (const [name, loader] of modules) {
  try {
    loader();
    console.log(`  OK: ${name}`);
  } catch (err) {
    console.log(`  FAIL: ${name} -> ${err.message}`);
    if (err.stack) console.log(`    ${err.stack.split('\n')[1]?.trim()}`);
  }
}

// Try starting server
console.log('\n=== Starting Server ===');
try {
  const app = require('./app');
  const http = require('http');
  const server = http.createServer(app);
  server.listen(3001, '127.0.0.1', () => {
    console.log('  SERVER STARTED on http://127.0.0.1:3001');
    // Test health endpoint
    const req = http.get('http://127.0.0.1:3001/api/health', (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        console.log(`  Health endpoint: ${res.statusCode}`);
        console.log(`  Response: ${data.slice(0, 200)}`);
        process.exit(0);
      });
    });
    req.on('error', (e) => { console.log('  Request error:', e.message); process.exit(1); });
    setTimeout(() => { console.log('  Timeout — but server is running'); process.exit(0); }, 5000);
  });
  server.on('error', (e) => { console.log('  Server error:', e.message); process.exit(1); });
} catch (err) {
  console.log(`  CRASH: ${err.message}`);
  console.log(err.stack);
  process.exit(1);
}
