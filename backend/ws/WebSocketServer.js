const WebSocket = require('ws');
const logger = require('../utils/logger');

let wss = null;

function setupWebSocket(server) {
  wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    logger.info('WebSocket client connected');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (data.event === 'ping') {
          ws.send(JSON.stringify({ event: 'pong' }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on('close', () => {
      logger.debug('WebSocket client disconnected');
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error:', err.message);
    });
  });

  logger.info('WebSocket server attached at /ws');
}

function broadcast(event, data) {
  if (!wss) return;
  const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

module.exports = { setupWebSocket, broadcast };
