# System Design Document
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. System Overview

The toolkit is a **monorepo full-stack web application** designed to run locally on a personal computer. It has two major subsystems:

- **Frontend (React SPA)** — user interface, dashboard, module views
- **Backend (Node.js API Server)** — system data collection, file watching, log tailing, WebSocket events

Both are served from a single Express server on `localhost:3001` in production.

---

## 2. Component Design

### 2.1 Backend Components

```
server/
├── index.js                  ← Express app entry point
│
├── routes/                   ← HTTP route handlers (thin layer)
│   ├── audit.js              GET /api/audit
│   ├── network.js            GET /api/network/scan
│   ├── integrity.js          GET /api/integrity/status, POST /api/integrity/add
│   ├── password.js           POST /api/password/check
│   ├── logs.js               GET /api/logs
│   └── alerts.js             GET /api/alerts
│
├── services/                 ← Business logic (OS interaction)
│   ├── SystemService.js      ← exec ps, netstat, service list
│   ├── NetworkService.js     ← ARP cache, ping sweep
│   ├── FileService.js        ← SHA-256 hashing, chokidar watcher
│   ├── PasswordService.js    ← entropy calc, dictionary check
│   └── LogService.js         ← tail auth.log, pattern matching
│
├── ws/
│   └── WebSocketServer.js    ← WS event broadcasting
│
└── data/
    ├── hashes.json           ← file baseline store
    ├── alerts.json           ← alert history
    └── config.json           ← monitored paths, scan intervals
```

---

### 2.2 Frontend Components

```
client/src/
├── App.jsx                   ← Router setup
├── main.jsx                  ← React root
│
├── pages/
│   ├── DashboardPage.jsx     ← Main overview (all module cards)
│   ├── AuditPage.jsx         ← Detailed system audit view
│   ├── IntegrityPage.jsx     ← File watchlist management
│   ├── NetworkPage.jsx       ← LAN device table
│   ├── PasswordPage.jsx      ← Password strength UI
│   └── LogsPage.jsx          ← Auth log event viewer
│
├── components/
│   ├── ModuleCard.jsx        ← Summary card with status/alert count
│   ├── AlertFeed.jsx         ← Real-time alert list
│   ├── SeverityBadge.jsx     ← Color-coded LOW/MED/HIGH/CRITICAL badge
│   ├── StrengthMeter.jsx     ← Visual password strength bar
│   ├── HashTable.jsx         ← File hash comparison table
│   └── DeviceTable.jsx       ← Network devices table
│
├── hooks/
│   ├── usePolling.js         ← Generic interval-based API polling
│   └── useWebSocket.js       ← WS connection + event subscription
│
├── context/
│   └── SecurityContext.jsx   ← Global alert state + WebSocket instance
│
└── api/
    └── client.js             ← Axios instance configured for localhost:3001
```

---

## 3. Data Flow Diagrams

### 3.1 System Audit Flow

```
User opens Dashboard
        │
        ▼
React polls GET /api/audit (every 60s)
        │
        ▼
Express route → SystemService
        │
        ├── exec('ps aux')          → process list
        ├── exec('netstat -tuln')   → open ports
        └── exec('systemctl list-units') → services
        │
        ▼
SystemService applies risk rules
        │ (flag: port 23 open, unknown root process, etc.)
        ▼
JSON response → React → renders in AuditPage
```

---

### 3.2 File Integrity Flow

```
User adds file path → POST /api/integrity/add
        │
        ▼
FileService.hashFile(path) → SHA-256 hash
        │
        ▼
Save to hashes.json: { path, hash, timestamp }
        │
        ▼
chokidar.watch(path) starts monitoring
        │
        ▼  [on file change event]
FileService recomputes hash
        │
        ├── hash matches? → no action
        └── hash differs? → create alert object
                │
                ▼
        WebSocketServer.broadcast('file_change', alert)
                │
                ▼
        React receives WS event → AlertFeed updates
```

---

### 3.3 Log Monitoring Flow

```
LogService starts on server boot
        │
        ▼
tail.Tail('/var/log/auth.log') → stream new lines
        │
        ▼
Each line tested against PATTERNS:
  - /Failed password/
  - /Invalid user/
  - /authentication failure/
        │
        ├── no match → discard
        └── match → parse into event object { type, ip, user, time, severity }
                │
                ├── store in memory (last 200 events)
                │
                └── severity HIGH/CRITICAL?
                        │
                        ▼
                WebSocketServer.broadcast('log_alert', event)
                        │
                        ▼
                React AlertFeed → instant notification
```

---

### 3.4 Password Check Flow

```
User types password in PasswordPage
        │
        ▼
POST /api/password/check { password: "..." }
        │
        ▼
PasswordService.analyze(password)
  ├── length >= 12?
  ├── has uppercase?
  ├── has lowercase?
  ├── has numbers?
  ├── has symbols?
  ├── in top-10000 list?
  └── contains dictionary word?
        │
        ▼
Calculate entropy: log2(charsetSize ^ length)
        │
        ▼
Return { score, entropy, checks, strength, suggestions }
        │
        ▼
Password NOT stored or logged anywhere
        │
        ▼
React renders StrengthMeter + suggestions list
```

---

## 4. Alert System Design

### 4.1 Alert Object Schema

```json
{
  "id": "uuid-v4",
  "source": "file_integrity | log_monitor | network | audit",
  "type": "file_change | brute_force | unknown_device | open_port | invalid_login",
  "severity": "LOW | MEDIUM | HIGH | CRITICAL",
  "title": "Unauthorized file modification detected",
  "detail": "/etc/passwd was modified at 14:32:05",
  "timestamp": 1711900800000,
  "acknowledged": false
}
```

### 4.2 Severity Assignment Rules

| Event | Severity |
|---|---|
| File changed: system file (/etc/passwd, /etc/hosts) | CRITICAL |
| File changed: user file | HIGH |
| Brute force: 5+ failures from same IP | CRITICAL |
| Single failed login | LOW |
| New unknown device on LAN | MEDIUM |
| Risky port open (Telnet, FTP) | HIGH |
| Weak password detected | MEDIUM |

---

## 5. WebSocket Protocol

```
Client connects: ws://localhost:3001

Server → Client events:
{
  "event": "file_change",
  "data": { "path": "/etc/passwd", "severity": "CRITICAL", "timestamp": 1711900800000 }
}

{
  "event": "log_alert",
  "data": { "type": "brute_force", "ip": "192.168.1.50", "count": 8, "severity": "CRITICAL" }
}

{
  "event": "new_device",
  "data": { "ip": "192.168.1.99", "mac": "AA:BB:CC:11:22:33", "severity": "MEDIUM" }
}

Client → Server (heartbeat):
{ "event": "ping" }
```

---

## 6. Database Design (JSON Files)

### hashes.json
```json
{
  "/etc/passwd": {
    "hash": "5e884898da28047151d0e56f8dc629277",
    "addedAt": 1711900800000,
    "lastChecked": 1711900900000,
    "status": "clean"
  }
}
```

### alerts.json
```json
[
  {
    "id": "a1b2c3",
    "source": "file_integrity",
    "type": "file_change",
    "severity": "CRITICAL",
    "timestamp": 1711900800000,
    "acknowledged": false
  }
]
```

### config.json
```json
{
  "monitoredPaths": ["/etc/passwd", "/etc/hosts", "/home/user/.bashrc"],
  "scanIntervals": {
    "audit": 60000,
    "network": 120000,
    "logs": "realtime"
  },
  "knownDevices": ["AA:BB:CC:DD:EE:FF"],
  "logPath": "/var/log/auth.log"
}
```

---

## 7. Error Handling Strategy

| Scenario | Handling |
|---|---|
| OS command fails | Return `{ error: true, message: "..." }` — don't crash server |
| Log file not found | Log warning, return empty events array |
| File hash fails (permissions) | Mark file as "unreadable" in response |
| Network scan times out | Return partial results with timeout flag |
| WebSocket client disconnects | Clean up listener, no crash |
| JSON data file corrupt | Reset to empty default, log warning |

---

## 8. Scalability Notes

This is a **single-user local tool** — no multi-tenancy required. Design tradeoffs made:

- In-memory log buffer (last 200 events) instead of a database
- JSON files instead of SQLite (simpler, sufficient for single user)
- Polling + WebSocket hybrid (polling for non-critical modules, WS for critical)
- No auth layer (localhost only — user's OS provides the security boundary)
