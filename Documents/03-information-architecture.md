# 03 — Information Architecture
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Site Map

```
cybersec-toolkit (localhost:3001)
│
├── / ──────────────────────────── Dashboard (Home)
│       ├── Module Summary Cards (x5)
│       ├── Overall Health Score
│       └── Live Alert Feed
│
├── /audit ─────────────────────── System Security Audit
│       ├── Running Processes Table
│       ├── Open Ports Table
│       ├── Active Services Table
│       └── Risk Flags Panel
│
├── /integrity ─────────────────── File Integrity Monitor
│       ├── Add File / Directory Input
│       ├── Watchlist Table (files + status)
│       └── Change History (from Supabase)
│
├── /network ───────────────────── Network Monitor
│       ├── Scan Controls (manual trigger)
│       ├── Connected Devices Table
│       └── Unknown Device Alerts
│
├── /password ──────────────────── Password Strength Checker
│       ├── Password Input
│       ├── Strength Meter
│       ├── Checks Checklist
│       └── Improvement Suggestions
│
└── /logs ──────────────────────── Security Log Monitor
        ├── Event Type Filter
        ├── Severity Filter
        ├── Auth Events Table (realtime)
        └── Brute Force Alert Banner
```

---

## 2. Navigation Structure

**Primary Navigation (Sidebar):**
- 🏠 Dashboard
- 🔍 System Audit
- 📁 File Integrity
- 🌐 Network
- 🔑 Password
- 📋 Logs

Each nav item shows a live badge with unacknowledged alert count.

---

## 3. Page Layouts

### 3.1 Dashboard Page

```
┌──────────────────────────────────────────────────────┐
│  🛡 CyberSec Toolkit        Health Score: 72%  🟡    │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐               │
│  │ System  │ │  File   │ │ Network │               │
│  │  Audit  │ │Integrity│ │ Monitor │               │
│  │  ✅ OK  │ │ 🔴 2 ⚠ │ │ 🟡 1 ⚠ │               │
│  └─────────┘ └─────────┘ └─────────┘               │
│                                                      │
│  ┌─────────┐ ┌─────────┐                            │
│  │Password │ │  Logs   │                            │
│  │Checker  │ │ Monitor │                            │
│  │  🟢 —  │ │ 🔴 5 ⚠ │                            │
│  └─────────┘ └─────────┘                            │
│                                                      │
│  ── Live Alert Feed ──────────────────────────────  │
│  🔴 CRITICAL  Brute force from 192.168.1.50  2m ago │
│  🔴 HIGH      /etc/passwd modified           5m ago │
│  🟡 MEDIUM    Unknown device: 192.168.1.99   1h ago │
└──────────────────────────────────────────────────────┘
```

---

### 3.2 File Integrity Page

```
┌──────────────────────────────────────────────────────┐
│  📁 File Integrity Monitor                           │
├──────────────────────────────────────────────────────┤
│  Add path:  [/etc/passwd____________] [+ Add File]   │
├──────────────────────────────────────────────────────┤
│  File Path          │ Status   │ Last Checked        │
│  /etc/passwd        │ 🔴 MODIFIED│ 2m ago           │
│  /etc/hosts         │ ✅ Clean  │ 5m ago             │
│  /home/user/.bashrc │ ✅ Clean  │ 5m ago             │
├──────────────────────────────────────────────────────┤
│  Change History                                      │
│  /etc/passwd  abc123 → def456  14:32:01  [Dismiss]  │
└──────────────────────────────────────────────────────┘
```

---

### 3.3 Network Monitor Page

```
┌──────────────────────────────────────────────────────┐
│  🌐 Network Monitor              [🔄 Rescan]         │
├──────────────────────────────────────────────────────┤
│  IP Address    │ MAC Address        │ Status  │ Trust │
│  192.168.1.1   │ AA:BB:CC:DD:EE:FF │ Router  │ ✅    │
│  192.168.1.5   │ 11:22:33:44:55:66 │ Laptop  │ ✅    │
│  192.168.1.99  │ 99:88:77:66:55:44 │ Unknown │ [Trust]│
└──────────────────────────────────────────────────────┘
```

---

### 3.4 Password Checker Page

```
┌──────────────────────────────────────────────────────┐
│  🔑 Password Strength Checker                        │
├──────────────────────────────────────────────────────┤
│  Password: [••••••••••••] [👁]                       │
│                                                      │
│  Strength: ████████░░  Strong (78/100)               │
│                                                      │
│  ✅ At least 12 characters                           │
│  ✅ Contains uppercase letters                       │
│  ✅ Contains numbers                                 │
│  ❌ No symbols found — add ! @ # $                   │
│  ✅ Not a common password                            │
│  ✅ No dictionary words detected                     │
│                                                      │
│  Entropy: 52.3 bits                                  │
└──────────────────────────────────────────────────────┘
```

---

## 4. Alert Severity Color System

| Severity | Color | Badge | Use Case |
|---|---|---|---|
| CRITICAL | Red `#EF4444` | 🔴 | Brute force, system file change |
| HIGH | Orange `#F97316` | 🟠 | User file change, risky port |
| MEDIUM | Yellow `#EAB308` | 🟡 | Unknown device, weak password |
| LOW | Blue `#3B82F6` | 🔵 | Single failed login |
| Safe | Green `#22C55E` | ✅ | No issues detected |

---

## 5. Data Hierarchy

```
Security Event
├── source      (file_integrity | log_monitor | network | audit)
├── type        (file_change | brute_force | unknown_device | open_port | failed_login)
├── severity    (CRITICAL | HIGH | MEDIUM | LOW)
├── title       (human-readable summary)
├── detail      (specific info: IP, path, hash, etc.)
├── timestamp
└── acknowledged (bool)
```

---

## 6. User Flows

### Flow 1: File gets modified → user sees alert
1. User adds `/etc/passwd` to watchlist
2. File is modified externally
3. `chokidar` detects change in < 1 second
4. Backend computes new hash, finds mismatch
5. Alert inserted into Supabase `security_alerts`
6. Supabase Realtime pushes alert to frontend
7. Dashboard alert feed updates instantly
8. User clicks alert → sees old/new hash
9. User clicks "Acknowledge" → alert resolved

### Flow 2: Brute force attack → CRITICAL alert
1. LogService tails `/var/log/auth.log`
2. 5 failed login lines from same IP detected within 60s
3. CRITICAL alert created in Supabase
4. Realtime pushes to dashboard
5. Red banner appears on dashboard with attacker IP
