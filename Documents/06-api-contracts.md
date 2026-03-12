# 06 — API Contracts
## Personal Cybersecurity Toolkit — Hawkathon 2026

**Base URL:** `http://localhost:3001/api`  
**Format:** JSON  
**Auth:** None (localhost only)

---

## 1. System Audit

### `GET /api/audit`
Returns full system audit snapshot.

**Response:**
```json
{
  "timestamp": "2026-03-12T10:30:00Z",
  "processes": [
    { "pid": 1234, "user": "root", "cpu": "0.1", "mem": "0.5", "command": "nginx" }
  ],
  "ports": [
    { "protocol": "tcp", "port": 80, "state": "LISTEN" },
    { "protocol": "tcp", "port": 23, "state": "LISTEN" }
  ],
  "services": [
    { "name": "sshd", "status": "active" },
    { "name": "nginx", "status": "active" }
  ],
  "riskFlags": [
    { "level": "HIGH", "message": "Port 23 (Telnet) is open" },
    { "level": "MEDIUM", "message": "Unknown process: suspicious.sh (PID 9999)" }
  ]
}
```

**Error Response (500):**
```json
{ "error": true, "message": "Failed to read system processes" }
```

---

## 2. File Integrity

### `GET /api/integrity/status`
Returns all monitored files and their current status.

**Response:**
```json
{
  "files": [
    {
      "id": "uuid",
      "file_path": "/etc/passwd",
      "baseline_hash": "abc123...",
      "last_hash": "def456...",
      "status": "modified",
      "last_checked": "2026-03-12T10:25:00Z"
    }
  ],
  "summary": { "total": 3, "clean": 2, "modified": 1, "missing": 0 }
}
```

---

### `POST /api/integrity/add`
Adds a file or directory to the watchlist.

**Request Body:**
```json
{ "path": "/etc/hosts" }
```

**Response (201):**
```json
{
  "success": true,
  "file_path": "/etc/hosts",
  "hash": "5e884898da28047151d0e56f8dc629277"
}
```

**Error Response (400):**
```json
{ "error": true, "message": "File not found or unreadable: /etc/hosts" }
```

---

### `DELETE /api/integrity/remove`
Removes a file from the watchlist.

**Request Body:**
```json
{ "path": "/etc/hosts" }
```

**Response (200):**
```json
{ "success": true, "removed": "/etc/hosts" }
```

---

### `GET /api/integrity/history?limit=50`
Returns file change history from Supabase.

**Response:**
```json
{
  "changes": [
    {
      "id": "uuid",
      "file_path": "/etc/passwd",
      "old_hash": "abc123",
      "new_hash": "def456",
      "detected_at": "2026-03-12T10:25:00Z",
      "acknowledged": false
    }
  ]
}
```

---

## 3. Network Monitor

### `GET /api/network/scan`
Triggers a LAN scan and returns connected devices.

**Query Params:**
- `?force=true` — forces a fresh ping sweep (slow, ~30s)
- Default: returns cached ARP table (fast)

**Response:**
```json
{
  "scanned_at": "2026-03-12T10:30:00Z",
  "devices": [
    {
      "ip_address": "192.168.1.1",
      "mac_address": "AA:BB:CC:DD:EE:FF",
      "hostname": "router",
      "is_trusted": true,
      "last_seen": "2026-03-12T10:30:00Z"
    },
    {
      "ip_address": "192.168.1.99",
      "mac_address": "11:22:33:44:55:66",
      "hostname": "unknown",
      "is_trusted": false,
      "last_seen": "2026-03-12T10:30:00Z"
    }
  ],
  "unknownCount": 1
}
```

---

### `PATCH /api/network/trust`
Marks a device as trusted.

**Request Body:**
```json
{ "mac_address": "11:22:33:44:55:66" }
```

**Response (200):**
```json
{ "success": true, "mac_address": "11:22:33:44:55:66", "is_trusted": true }
```

---

## 4. Password Strength

### `POST /api/password/check`
Evaluates password strength. Password is never logged or stored.

**Request Body:**
```json
{ "password": "MyPassword123" }
```

**Response:**
```json
{
  "score": 5,
  "strength": "Good",
  "entropy_bits": 47.2,
  "checks": {
    "length": true,
    "uppercase": true,
    "lowercase": true,
    "numbers": true,
    "symbols": false,
    "not_common": true,
    "no_dict_word": false
  },
  "suggestions": [
    "Add symbols like ! @ # $ to increase strength",
    "Avoid using dictionary words like 'Password'"
  ]
}
```

**Strength Labels:**

| Score | Label |
|---|---|
| 0–2 | Weak |
| 3–4 | Fair |
| 5 | Good |
| 6 | Strong |
| 7 | Very Strong |

---

## 5. Security Logs

### `GET /api/logs?limit=100&severity=HIGH`
Returns recent auth log events from Supabase.

**Query Params:**
- `limit` — number of events (default: 100)
- `severity` — filter by severity level (optional)

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "event_type": "failedLogin",
      "source_ip": "192.168.1.50",
      "username": "root",
      "severity": "MEDIUM",
      "detected_at": "2026-03-12T10:20:00Z"
    }
  ],
  "summary": {
    "total": 42,
    "critical": 2,
    "high": 8,
    "medium": 20,
    "low": 12
  }
}
```

---

## 6. Alerts

### `GET /api/alerts?unacknowledged=true&limit=50`
Returns all security alerts from Supabase.

**Response:**
```json
{
  "alerts": [
    {
      "id": "uuid",
      "source": "file_integrity",
      "type": "file_change",
      "severity": "CRITICAL",
      "title": "System file modified",
      "detail": "/etc/passwd hash changed at 10:25:01",
      "timestamp": "2026-03-12T10:25:01Z",
      "acknowledged": false
    }
  ],
  "counts": { "critical": 1, "high": 2, "medium": 3, "low": 5 }
}
```

---

### `PATCH /api/alerts/:id/acknowledge`
Marks a single alert as acknowledged.

**Response (200):**
```json
{ "success": true, "id": "uuid", "acknowledged": true }
```

---

### `PATCH /api/alerts/acknowledge-all`
Acknowledges all current alerts.

**Response (200):**
```json
{ "success": true, "acknowledged_count": 11 }
```

---

## 7. Health Check

### `GET /api/health`
Simple uptime check.

**Response:**
```json
{
  "status": "ok",
  "uptime_seconds": 3600,
  "supabase_connected": true,
  "watchers_active": 3,
  "log_tailer_active": true
}
```
