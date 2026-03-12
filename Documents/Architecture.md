# Architecture Document
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Overview

The Personal Cybersecurity Toolkit is a **web-based, locally hosted and webhost** full-stack application. It runs entirely on the user's and online server  machine — a Node.js backend exposes REST APIs that collect system-level data, and a React frontend renders that data as a live security dashboard.

No data ever leaves the user's machine. The system is offline-first by design.

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                  USER'S BROWSER                     │
│                                                     │
│   ┌─────────────────────────────────────────────┐   │
│   │         React Frontend (Vite + Tailwind)    │   │
│   │  ┌──────────┐ ┌──────────┐ ┌────────────┐  │   │
│   │  │ Dashboard│ │  Modules │ │   Alerts   │  │   │
│   │  └──────────┘ └──────────┘ └────────────┘  │   │
│   └─────────────────────────────────────────────┘   │
│                        │ HTTP REST / WebSocket       │
└────────────────────────┼────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────┐
│              Node.js Express Backend                │
│                   (localhost:3001)                  │
│                                                     │
│  ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ /audit   │ │ /network │ │ /integrity         │  │
│  ├──────────┤ ├──────────┤ ├────────────────────┤  │
│  │ /logs    │ │ /password│ │ /alerts            │  │
│  └──────────┘ └──────────┘ └────────────────────┘  │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │           Service Layer (Node.js)           │   │
│  │  SystemService │ NetworkService │ LogService │   │
│  │  FileService   │ PasswordService             │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
                         │
           ┌─────────────▼─────────────┐
           │      Operating System     │
           │  /proc  │  /var/log  │    │
           │  netstat│  auth.log  │    │
           │  ifconfig│  fs hashes│    │
           └───────────────────────────┘
```

---

## 3. Layer Breakdown

### 3.1 Frontend Layer (React + Vite + Tailwind CSS)

| Component | Responsibility |
|---|---|
| `Dashboard.jsx` | Main layout — aggregates all module cards |
| `SystemAudit.jsx` | Displays running processes, ports, services |
| `FileIntegrity.jsx` | Shows monitored files and hash change alerts |
| `NetworkMonitor.jsx` | Lists connected devices on LAN |
| `PasswordChecker.jsx` | Input + visual strength meter |
| `LogMonitor.jsx` | Parsed auth log events with severity tags |
| `AlertPanel.jsx` | Consolidated alert feed across all modules |

**State Management:** React Context API + `useState`/`useEffect` hooks  
**Polling:** Each module polls its REST endpoint every 30 seconds  
**Real-time:** WebSocket connection for log alerts and file change events

---

### 3.2 Backend Layer (Node.js + Express)

| Route | Module | Description |
|---|---|---|
| `GET /api/audit` | SystemService | Runs ps, netstat, lists open ports |
| `GET /api/network` | NetworkService | ARP table + ping sweep for LAN devices |
| `GET /api/integrity/scan` | FileService | Returns hash comparison results |
| `POST /api/integrity/add` | FileService | Registers new file/dir to monitor |
| `POST /api/password/check` | PasswordService | Evaluates password strength |
| `GET /api/logs` | LogService | Returns parsed suspicious log events |
| `GET /api/alerts` | AlertAggregator | Combined alerts across all modules |

---

### 3.3 Service Layer

Each service is a standalone Node.js module:

- **SystemService** — Executes `ps aux`, `netstat -tuln`, reads `/proc` on Linux
- **NetworkService** — Reads ARP cache (`arp -a`), performs ICMP ping sweep
- **FileService** — Computes SHA-256 hashes via Node `crypto`, stores baseline in local JSON DB
- **PasswordService** — Pure JavaScript — checks entropy, patterns, dictionary words
- **LogService** — Reads `/var/log/auth.log` (Linux) or Windows Event Log via PowerShell

---

### 3.4 Local Storage

```
/data/
  hashes.json        ← file integrity baseline
  alerts.json        ← alert history
  config.json        ← monitored paths, scan intervals
```

also read Supabase db design.md for the data base 

---

## 4. Communication Flow

```
Browser ──polling (30s)──► Express API ──► Service Layer ──► OS
Browser ◄── JSON response ─── Express API ◄── parsed data ─── OS

Browser ◄══ WebSocket ═══════ Express ◄── FileWatcher / LogTailer
```

---

## 5. Security Considerations

- Backend only binds to `127.0.0.1` — not accessible over network
- No authentication required (local-only access)
- Password checker runs entirely in memory — passwords never logged or stored
- Log file access uses read-only file handles

---

## 6. Deployment

```
npm install          # install dependencies
npm run build        # build React frontend
npm start            # start Express backend (serves frontend + API)
# open http://localhost:3001
```
