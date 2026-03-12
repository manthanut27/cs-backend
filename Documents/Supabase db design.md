# Supabase Database Design
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Setup

1. Go to https://supabase.com → New Project
2. Save your `Project URL` and `anon public key`
3. Create a `.env` file in your server folder:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
```

4. Install the client:
```bash
npm install @supabase/supabase-js
```

---

## 2. SQL Schema (run in Supabase SQL Editor)

```sql
-- =============================================
-- TABLE 1: File Integrity Hashes
-- =============================================
CREATE TABLE file_hashes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL UNIQUE,
  baseline_hash TEXT NOT NULL,
  last_hash TEXT,
  status TEXT DEFAULT 'clean' CHECK (status IN ('clean', 'modified', 'missing')),
  added_at TIMESTAMPTZ DEFAULT now(),
  last_checked TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLE 2: File Change History
-- =============================================
CREATE TABLE file_change_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path TEXT NOT NULL,
  old_hash TEXT,
  new_hash TEXT,
  detected_at TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false
);

-- =============================================
-- TABLE 3: Security Alerts
-- =============================================
CREATE TABLE security_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('file_integrity', 'log_monitor', 'network', 'audit')),
  type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title TEXT NOT NULL,
  detail TEXT,
  timestamp TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN DEFAULT false
);

-- =============================================
-- TABLE 4: Network Devices
-- =============================================
CREATE TABLE network_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  mac_address TEXT UNIQUE,
  hostname TEXT,
  is_trusted BOOLEAN DEFAULT false,
  first_seen TIMESTAMPTZ DEFAULT now(),
  last_seen TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- TABLE 5: Auth Log Events
-- =============================================
CREATE TABLE auth_log_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  source_ip TEXT,
  username TEXT,
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  raw_line TEXT,
  detected_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES for performance
-- =============================================
CREATE INDEX idx_alerts_severity ON security_alerts(severity);
CREATE INDEX idx_alerts_timestamp ON security_alerts(timestamp DESC);
CREATE INDEX idx_auth_events_ip ON auth_log_events(source_ip);
CREATE INDEX idx_auth_events_time ON auth_log_events(detected_at DESC);
CREATE INDEX idx_network_mac ON network_devices(mac_address);
```

---

## 3. Supabase Client Setup

```javascript
// server/lib/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = supabase;
```

---

## 4. Service Layer — DB Integration

### 4.1 File Integrity Service

```javascript
// server/services/FileService.js
const supabase = require('../lib/supabase');
const crypto = require('crypto');
const fs = require('fs');

function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Add file to watchlist — save baseline hash
async function addFile(filePath) {
  const hash = hashFile(filePath);
  const { error } = await supabase.from('file_hashes').upsert({
    file_path: filePath,
    baseline_hash: hash,
    last_hash: hash,
    status: 'clean',
    last_checked: new Date().toISOString()
  });
  if (error) throw error;
  return { filePath, hash };
}

// Check a file against its baseline
async function checkFile(filePath) {
  const { data } = await supabase
    .from('file_hashes')
    .select('baseline_hash')
    .eq('file_path', filePath)
    .single();

  const currentHash = hashFile(filePath);
  const changed = currentHash !== data.baseline_hash;

  // Update last_checked and status
  await supabase.from('file_hashes')
    .update({ last_hash: currentHash, status: changed ? 'modified' : 'clean', last_checked: new Date().toISOString() })
    .eq('file_path', filePath);

  if (changed) {
    // Log the change event
    await supabase.from('file_change_events').insert({
      file_path: filePath,
      old_hash: data.baseline_hash,
      new_hash: currentHash
    });
    // Create an alert
    await createAlert({
      source: 'file_integrity',
      type: 'file_change',
      severity: 'HIGH',
      title: 'File Modified',
      detail: `${filePath} hash changed`
    });
  }
  return { filePath, changed, currentHash };
}

// Get all monitored files
async function getAllFiles() {
  const { data } = await supabase.from('file_hashes').select('*').order('added_at', { ascending: false });
  return data;
}

module.exports = { addFile, checkFile, getAllFiles };
```

---

### 4.2 Alert Service

```javascript
// server/services/AlertService.js
const supabase = require('../lib/supabase');

async function createAlert({ source, type, severity, title, detail }) {
  const { data, error } = await supabase.from('security_alerts').insert({
    source, type, severity, title, detail
  }).select().single();
  if (error) throw error;
  return data;
}

async function getAlerts({ limit = 50, unacknowledgedOnly = false } = {}) {
  let query = supabase.from('security_alerts')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);
  if (unacknowledgedOnly) query = query.eq('acknowledged', false);
  const { data } = await query;
  return data;
}

async function acknowledgeAlert(id) {
  const { error } = await supabase.from('security_alerts')
    .update({ acknowledged: true })
    .eq('id', id);
  if (error) throw error;
}

module.exports = { createAlert, getAlerts, acknowledgeAlert };
```

---

### 4.3 Network Device Service

```javascript
// server/services/NetworkService.js
const supabase = require('../lib/supabase');
const { createAlert } = require('./AlertService');

async function upsertDevice({ ip, mac, hostname }) {
  // Check if device was seen before
  const { data: existing } = await supabase
    .from('network_devices')
    .select('id, is_trusted')
    .eq('mac_address', mac)
    .single();

  if (!existing) {
    // New unknown device — insert + alert
    await supabase.from('network_devices').insert({
      ip_address: ip, mac_address: mac, hostname: hostname || 'unknown'
    });
    await createAlert({
      source: 'network',
      type: 'unknown_device',
      severity: 'MEDIUM',
      title: 'Unknown Device Detected',
      detail: `New device on network: ${ip} (${mac})`
    });
  } else {
    // Known device — update last seen
    await supabase.from('network_devices')
      .update({ ip_address: ip, last_seen: new Date().toISOString() })
      .eq('mac_address', mac);
  }
}

async function getDevices() {
  const { data } = await supabase.from('network_devices')
    .select('*')
    .order('last_seen', { ascending: false });
  return data;
}

async function trustDevice(mac) {
  await supabase.from('network_devices')
    .update({ is_trusted: true })
    .eq('mac_address', mac);
}

module.exports = { upsertDevice, getDevices, trustDevice };
```

---

### 4.4 Auth Log Service

```javascript
// server/services/LogService.js
const supabase = require('../lib/supabase');
const { createAlert } = require('./AlertService');
const Tail = require('tail').Tail;

const PATTERNS = {
  failedLogin:   { regex: /Failed password for .* from ([\d.]+)/, severity: 'MEDIUM' },
  bruteForce:    { regex: /authentication failure/i,              severity: 'HIGH'   },
  invalidUser:   { regex: /Invalid user (\w+) from ([\d.]+)/,     severity: 'MEDIUM' },
  sudoFailed:    { regex: /sudo.*FAILED/,                         severity: 'HIGH'   },
};

// Track failed attempts per IP for brute force detection
const failureTracker = {};

async function processLogLine(line) {
  for (const [type, { regex, severity }] of Object.entries(PATTERNS)) {
    if (regex.test(line)) {
      const match = line.match(regex);
      const sourceIp = match?.[1] || null;

      // Insert into DB
      await supabase.from('auth_log_events').insert({
        event_type: type,
        source_ip: sourceIp,
        severity,
        raw_line: line
      });

      // Brute force detection — 5 failures from same IP in 60s
      if (sourceIp) {
        const now = Date.now();
        if (!failureTracker[sourceIp]) failureTracker[sourceIp] = [];
        failureTracker[sourceIp].push(now);
        failureTracker[sourceIp] = failureTracker[sourceIp].filter(t => now - t < 60000);

        if (failureTracker[sourceIp].length >= 5) {
          await createAlert({
            source: 'log_monitor',
            type: 'brute_force',
            severity: 'CRITICAL',
            title: 'Brute Force Attack Detected',
            detail: `${failureTracker[sourceIp].length} failed logins from ${sourceIp} in 60s`
          });
        }
      }
      break;
    }
  }
}

function startLogTail(logPath = '/var/log/auth.log') {
  const tail = new Tail(logPath);
  tail.on('line', processLogLine);
  tail.on('error', err => console.error('Log tail error:', err));
}

async function getRecentEvents(limit = 100) {
  const { data } = await supabase.from('auth_log_events')
    .select('*')
    .order('detected_at', { ascending: false })
    .limit(limit);
  return data;
}

module.exports = { startLogTail, getRecentEvents };
```

---

## 5. Real-time Subscriptions (Supabase → Frontend)

Supabase supports real-time via WebSockets natively. Use this in your React frontend instead of a custom WS server:

```javascript
// client/src/hooks/useRealtimeAlerts.js
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    // Initial load
    supabase.from('security_alerts')
      .select('*').order('timestamp', { ascending: false }).limit(50)
      .then(({ data }) => setAlerts(data));

    // Subscribe to new inserts
    const channel = supabase.channel('alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'security_alerts'
      }, (payload) => {
        setAlerts(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  return alerts;
}
```

Add to your React `.env`:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 6. Summary — What Goes Where

| Data | Table | Realtime? |
|---|---|---|
| Monitored file baselines | `file_hashes` | No |
| File change history | `file_change_events` | Yes |
| All security alerts | `security_alerts` | Yes ✅ |
| LAN devices | `network_devices` | Yes |
| Auth log events | `auth_log_events` | Yes ✅ |
