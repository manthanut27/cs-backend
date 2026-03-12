// Ports considered risky when open
const RISKY_PORTS = {
  21:   { name: 'FTP',    level: 'HIGH',   message: 'Port 21 (FTP) is open — unencrypted file transfer' },
  23:   { name: 'Telnet', level: 'HIGH',   message: 'Port 23 (Telnet) is open — unencrypted remote access' },
  445:  { name: 'SMB',    level: 'HIGH',   message: 'Port 445 (SMB) is open — vulnerable to ransomware' },
  3389: { name: 'RDP',    level: 'MEDIUM', message: 'Port 3389 (RDP) is open — remote desktop access' },
  5900: { name: 'VNC',    level: 'MEDIUM', message: 'Port 5900 (VNC) is open — remote screen access' },
  135:  { name: 'RPC',    level: 'MEDIUM', message: 'Port 135 (RPC) is open — Windows RPC endpoint' },
  139:  { name: 'NetBIOS',level: 'MEDIUM', message: 'Port 139 (NetBIOS) is open' },
};

// System file paths that trigger CRITICAL alerts when modified
const CRITICAL_PATHS = [
  '/etc/passwd', '/etc/shadow', '/etc/hosts', '/etc/sudoers',
  '/etc/ssh/sshd_config', '/etc/crontab',
  'C:\\Windows\\System32\\drivers\\etc\\hosts',
  'C:\\Windows\\System32\\config\\SAM',
];

function checkPortRisk(port) {
  return RISKY_PORTS[port] || null;
}

function isSystemFile(filePath) {
  return CRITICAL_PATHS.some(p => filePath.toLowerCase().startsWith(p.toLowerCase()));
}

module.exports = { RISKY_PORTS, CRITICAL_PATHS, checkPortRisk, isSystemFile };
