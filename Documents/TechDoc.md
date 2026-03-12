# Technical Documentation
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Tech Stack

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| Frontend | React | 18.x | UI framework |
| Frontend | Vite | 5.x | Build tool + dev server |
| Frontend | Tailwind CSS | 3.x | Utility-first styling |
| Frontend | GSAP | 3.x | Animations |
| Frontend | React Router | 6.x | Client-side routing |
| Backend | Node.js | 20.x LTS | Runtime |
| Backend | Express.js | 4.x | REST API server |
| Backend | ws | 8.x | WebSocket server |
| Backend | chokidar | 3.x | File system watcher |
| Backend | crypto (built-in) | — | SHA-256 hashing |
| Storage | JSON files | — | Local persistence |

---

## 2. Project Structure

```
cybersec-toolkit/
├── client/                     ← React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── SystemAudit.jsx
│   │   │   ├── FileIntegrity.jsx
│   │   │   ├── NetworkMonitor.jsx
│   │   │   ├── PasswordChecker.jsx
│   │   │   ├── LogMonitor.jsx
│   │   │   └── AlertPanel.jsx
│   │   ├── hooks/
│   │   │   ├── usePolling.js
│   │   │   └── useWebSocket.js
│   │   ├── context/
│   │   │   └── SecurityContext.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                     ← Node.js backend
│   ├── routes/
│   │   ├── audit.js
│   │   ├── network.js
│   │   ├── integrity.js
│   │   ├── password.js
│   │   ├── logs.js
│   │   └── alerts.js
│   ├── services/
│   │   ├── SystemService.js
│   │   ├── NetworkService.js
│   │   ├── FileService.js
│   │   ├── PasswordService.js
│   │   └── LogService.js
│   ├── utils/
│   │   ├── hasher.js
│   │   └── logger.js
│   ├── data/
│   │   ├── hashes.json
│   │   ├── alerts.json
│   │   └── config.json
│   └── index.js
│
├── package.json
└── README.md
```

---

## 3. Module Technical Specifications

### 3.1 System Security Audit

**Implementation:** Child process execution via Node.js `child_process.exec`

```javascript
// server/services/SystemService.js
const { exec } = require('child_process');

async function getProcesses() {
  return new Promise((resolve, reject) => {
    exec('ps aux --no-headers', (err, stdout) => {
      if (err) return reject(err);
      const processes = stdout.trim().split('\n').map(line => {
        const parts = line.trim().split(/\s+/);
        return { user: parts[0], pid: parts[1], cpu: parts[2],
                 mem: parts[3], command: parts.slice(10).join(' ') };
      });
      resolve(processes);
    });
  });
}

async function getOpenPorts() {
  return new Promise((resolve, reject) => {
    exec('netstat -tuln', (err, stdout) => {
      // parse and return port list
    });
  });
}
```

**Windows alternative:** Replace `ps aux` with `tasklist` and `netstat -ano`

**API response shape:**
```json
{
  "processes": [{ "pid": 1234, "user": "root", "cpu": "0.1", "command": "nginx" }],
  "ports": [{ "protocol": "tcp", "port": 80, "state": "LISTEN" }],
  "services": [{ "name": "sshd", "status": "active" }],
  "riskFlags": ["Port 23 (Telnet) is open", "Unknown process: xyz.sh"]
}
```

---

### 3.2 File Integrity Monitoring

**Algorithm:** SHA-256 via Node.js built-in `crypto` module

```javascript
// server/services/FileService.js
const crypto = require('crypto');
const fs = require('fs');
const chokidar = require('chokidar');

function hashFile(filePath) {
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function startWatcher(paths, onChangeCallback) {
  const watcher = chokidar.watch(paths, { persistent: true });
  watcher.on('change', (path) => {
    const newHash = hashFile(path);
    const baseline = loadBaseline(path);
    if (newHash !== baseline) {
      onChangeCallback({ path, oldHash: baseline, newHash, timestamp: Date.now() });
    }
  });
}
```

**Baseline storage (hashes.json):**
```json
{
  "/etc/passwd": { "hash": "abc123...", "addedAt": 1700000000 },
  "/home/user/.bashrc": { "hash": "def456...", "addedAt": 1700000001 }
}
```

**Change alert triggers WebSocket push to frontend immediately.**

---

### 3.3 Local Network Monitoring

**Method 1 (ARP cache — fast):**
```javascript
exec('arp -a', (err, stdout) => {
  // parse: hostname (ip) at mac [ether] on interface
});
```

**Method 2 (Ping sweep — thorough):**
```javascript
async function pingSweep(subnet) {
  // e.g. subnet = "192.168.1"
  const promises = Array.from({ length: 254 }, (_, i) => 
    ping.promise.probe(`${subnet}.${i + 1}`, { timeout: 1 })
  );
  const results = await Promise.all(promises);
  return results.filter(r => r.alive);
}
```

**Response shape:**
```json
{
  "devices": [
    { "ip": "192.168.1.1", "mac": "AA:BB:CC:DD:EE:FF", "hostname": "router", "status": "active" },
    { "ip": "192.168.1.5", "mac": "11:22:33:44:55:66", "hostname": "unknown", "status": "active" }
  ],
  "unknownDevices": ["192.168.1.5"]
}
```

---

### 3.4 Password Strength Analysis

**Pure JavaScript — no external API calls. Password never leaves memory.**

```javascript
// server/services/PasswordService.js
const commonPasswords = require('./data/top10000passwords.json');

function analyzePassword(password) {
  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    notCommon: !commonPasswords.includes(password.toLowerCase()),
    noDictWord: !containsDictionaryWord(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const entropy = calculateEntropy(password);
  return { score, entropy, checks, strength: getLabel(score), suggestions: getSuggestions(checks) };
}
```

**Strength levels:** Weak (0-2) → Fair (3-4) → Good (5) → Strong (6) → Very Strong (7)

---

### 3.5 Security Log Monitoring

**Linux log path:** `/var/log/auth.log`  
**macOS log path:** `/var/log/system.log` (or `log show` command)  
**Windows:** PowerShell `Get-WinEvent` command

```javascript
// server/services/LogService.js
const tail = require('tail');

const PATTERNS = {
  failedLogin: /Failed password for .* from ([\d.]+)/,
  bruteForce: /authentication failure/i,
  invalidUser: /Invalid user (\w+) from ([\d.]+)/,
  sudoAttempt: /sudo.*FAILED/,
};

function parseLine(line) {
  for (const [type, regex] of Object.entries(PATTERNS)) {
    if (regex.test(line)) {
      return { type, line, timestamp: extractTimestamp(line), severity: getSeverity(type) };
    }
  }
  return null;
}
```

**Brute force detection:** 5+ failed logins from same IP within 60 seconds → HIGH severity alert

---

### 3.6 WebSocket Events

```javascript
// Real-time push events from server to frontend
{
  "event": "file_change",
  "data": { "path": "/etc/hosts", "severity": "HIGH" }
}
{
  "event": "log_alert",
  "data": { "type": "bruteForce", "ip": "192.168.1.50", "attempts": 8 }
}
{
  "event": "new_device",
  "data": { "ip": "192.168.1.99", "mac": "unknown" }
}
```

---

## 4. API Reference

| Method | Endpoint | Description | Response |
|---|---|---|---|
| GET | `/api/audit` | Full system audit | processes, ports, services, flags |
| GET | `/api/network/scan` | LAN device scan | devices[], unknownDevices[] |
| GET | `/api/integrity/status` | Hash comparison results | files[], changes[] |
| POST | `/api/integrity/add` | Add file to watchlist | `{ success, path }` |
| POST | `/api/password/check` | Analyze password strength | score, checks, suggestions |
| GET | `/api/logs?limit=50` | Recent suspicious log events | events[], summary |
| GET | `/api/alerts` | All active alerts | alerts[] sorted by severity |

---

## 5. Frontend Polling Strategy

```javascript
// hooks/usePolling.js
function usePolling(endpoint, interval = 30000) {
  const [data, setData] = useState(null);
  useEffect(() => {
    const fetch = () => api.get(endpoint).then(setData);
    fetch(); // immediate first call
    const id = setInterval(fetch, interval);
    return () => clearInterval(id);
  }, [endpoint, interval]);
  return data;
}
```

| Module | Poll Interval | Reason |
|---|---|---|
| System Audit | 60s | Low-change data |
| Network Scan | 120s | Expensive operation |
| File Integrity | Real-time (WS) | Critical — instant alerts |
| Log Monitor | Real-time (WS) | Critical — instant alerts |
| Password Check | On-demand | User triggered only |

---

## 6. Environment Setup

```bash
# Prerequisites
node >= 20.x
npm >= 9.x

# Install
git clone <repo>
cd cybersec-toolkit
npm install
cd client && npm install

# Development
npm run dev          # starts backend on :3001 + frontend on :5173

# Production
npm run build        # builds React into server/public/
npm start            # serves everything from :3001
```
