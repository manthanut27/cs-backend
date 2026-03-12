const { exec } = require('child_process');
const supabase = require('../lib/supabase');
const AlertService = require('./AlertService');
const { broadcast } = require('../ws/WebSocketServer');
const logger = require('../utils/logger');

/**
 * Parse ARP table output (cross-platform)
 */
function parseArpOutput(output) {
  const devices = [];
  const lines = output.trim().split('\n');

  for (const line of lines) {
    // Windows format: 192.168.1.1    aa-bb-cc-dd-ee-ff    dynamic
    // Linux format: hostname (192.168.1.1) at aa:bb:cc:dd:ee:ff [ether] on interface
    const winMatch = line.match(/([\d.]+)\s+([\w-]{17})\s+(\w+)/);
    const linuxMatch = line.match(/\(([\d.]+)\)\s+at\s+([\w:]{17})/);

    if (winMatch) {
      const [, ip, mac, type] = winMatch;
      if (mac !== 'ff-ff-ff-ff-ff-ff' && type !== 'static') {
        devices.push({
          ip_address: ip,
          mac_address: mac.replace(/-/g, ':').toUpperCase(),
          hostname: 'unknown',
        });
      }
    } else if (linuxMatch) {
      const [, ip, mac] = linuxMatch;
      devices.push({
        ip_address: ip,
        mac_address: mac.toUpperCase(),
        hostname: 'unknown',
      });
    }
  }
  return devices;
}

/**
 * Scan LAN using ARP table (fast)
 */
function scanARP() {
  return new Promise((resolve) => {
    const cmd = process.platform === 'win32' ? 'arp -a' : 'arp -a';
    exec(cmd, { timeout: 10000 }, (err, stdout) => {
      if (err) {
        logger.error('ARP scan failed:', err.message);
        resolve([]);
        return;
      }
      resolve(parseArpOutput(stdout));
    });
  });
}

/**
 * Get all network devices, merging with stored trust data
 */
async function getDevices() {
  const arpDevices = await scanARP();

  if (supabase) {
    // Merge with stored devices
    const { data: storedDevices } = await supabase
      .from('network_devices')
      .select('*')
      .order('last_seen', { ascending: false });

    const stored = storedDevices || [];
    const storedMap = new Map(stored.map(d => [d.mac_address, d]));

    const merged = [];
    const seenMacs = new Set();

    for (const dev of arpDevices) {
      const existing = storedMap.get(dev.mac_address);
      if (existing) {
        merged.push({ ...existing, ip_address: dev.ip_address });
        // Update last_seen
        await supabase.from('network_devices')
          .update({ ip_address: dev.ip_address, last_seen: new Date().toISOString() })
          .eq('mac_address', dev.mac_address);
      } else {
        // New device — insert
        const newDevice = {
          ip_address: dev.ip_address,
          mac_address: dev.mac_address,
          hostname: dev.hostname || 'unknown',
          is_trusted: false,
        };
        const { data: inserted } = await supabase
          .from('network_devices')
          .insert(newDevice)
          .select()
          .single();

        merged.push(inserted || newDevice);

        // Create alert for unknown device
        await AlertService.createAlert({
          source: 'network',
          type: 'unknown_device',
          severity: 'MEDIUM',
          title: 'Unknown Device Detected',
          detail: `New device on network: ${dev.ip_address} (${dev.mac_address})`,
        });

        broadcast('new_device', { ip: dev.ip_address, mac: dev.mac_address, severity: 'MEDIUM' });
      }
      seenMacs.add(dev.mac_address);
    }

    // Add stored devices not currently seen
    for (const dev of stored) {
      if (!seenMacs.has(dev.mac_address)) {
        merged.push(dev);
      }
    }

    const unknownCount = merged.filter(d => !d.is_trusted).length;
    return {
      scanned_at: new Date().toISOString(),
      devices: merged,
      unknownCount,
    };
  }

  // Fallback: return ARP devices with default trust=false
  const unknownCount = arpDevices.length;
  return {
    scanned_at: new Date().toISOString(),
    devices: arpDevices.map(d => ({ ...d, is_trusted: false, last_seen: new Date().toISOString() })),
    unknownCount,
  };
}

/**
 * Mark a device as trusted by MAC address
 */
async function trustDevice(macAddress) {
  if (supabase) {
    const { error } = await supabase
      .from('network_devices')
      .update({ is_trusted: true })
      .eq('mac_address', macAddress);
    if (error) throw error;
  }
  return { mac_address: macAddress, is_trusted: true };
}

module.exports = { getDevices, trustDevice, scanARP };
