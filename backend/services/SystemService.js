const si = require('systeminformation');
const { exec } = require('child_process');
const { checkPortRisk } = require('../utils/riskRules');
const logger = require('../utils/logger');

/**
 * Get running processes with PID, user, CPU%, memory%, command
 */
async function getProcesses() {
  try {
    const data = await si.processes();
    return data.list
      .sort((a, b) => b.cpu - a.cpu)
      .slice(0, 200)
      .map(p => ({
        pid: p.pid,
        user: p.user || 'SYSTEM',
        cpu: p.cpu.toFixed(1),
        mem: p.mem.toFixed(1),
        command: p.name || p.command || 'unknown',
      }));
  } catch (err) {
    logger.error('Failed to get processes:', err.message);
    return [];
  }
}

/**
 * Get open network ports
 */
async function getOpenPorts() {
  try {
    const connections = await si.networkConnections();
    const ports = [];
    const seen = new Set();

    for (const conn of connections) {
      if (conn.localPort && conn.state === 'LISTEN') {
        const key = `${conn.protocol}-${conn.localPort}`;
        if (!seen.has(key)) {
          seen.add(key);
          ports.push({
            protocol: conn.protocol || 'tcp',
            port: conn.localPort,
            state: conn.state,
            address: conn.localAddress || '0.0.0.0',
          });
        }
      }
    }
    return ports.sort((a, b) => a.port - b.port);
  } catch (err) {
    logger.error('Failed to get ports:', err.message);
    return [];
  }
}

/**
 * Get running system services
 */
async function getServices() {
  try {
    const data = await si.services('*');
    return data.slice(0, 50).map(s => ({
      name: s.name,
      status: s.running ? 'active' : 'inactive',
      cpu: s.cpu ? s.cpu.toFixed(1) : '0.0',
      mem: s.mem ? s.mem.toFixed(1) : '0.0',
    }));
  } catch (err) {
    logger.error('Failed to get services:', err.message);
    return [];
  }
}

/**
 * Generate risk flags based on open ports and process analysis
 */
function generateRiskFlags(ports, processes) {
  const flags = [];

  // Check for risky ports
  for (const port of ports) {
    const risk = checkPortRisk(port.port);
    if (risk) {
      flags.push({ level: risk.level, message: risk.message });
    }
  }

  // Check for suspicious processes (running as SYSTEM with unknown names)
  const suspiciousPatterns = [/^cmd\.exe$/i, /^powershell/i, /^nc(\.exe)?$/i, /ncat/i, /netcat/i];
  for (const proc of processes) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(proc.command) && proc.user === 'SYSTEM') {
        flags.push({
          level: 'MEDIUM',
          message: `Suspicious system process: ${proc.command} (PID ${proc.pid})`,
        });
      }
    }
  }

  return flags;
}

/**
 * Full audit — processes, ports, services, risk flags
 */
async function getFullAudit() {
  const [processes, ports, services] = await Promise.all([
    getProcesses(),
    getOpenPorts(),
    getServices(),
  ]);

  const riskFlags = generateRiskFlags(ports, processes);

  return {
    timestamp: new Date().toISOString(),
    processes,
    ports,
    services,
    riskFlags,
  };
}

module.exports = { getProcesses, getOpenPorts, getServices, generateRiskFlags, getFullAudit };
