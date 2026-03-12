# 01 — Product Requirements
## Personal Cybersecurity Toolkit — Hawkathon 2026

**Version:** 1.0 | **Track:** Cybersecurity — Endpoint Protection | **Date:** March 2026

---

## 1. Problem Statement

Personal computers handle communication, financial transactions, sensitive storage, and development work — yet most users have zero visibility into their system's security state. Security-relevant data (logs, processes, network activity, file changes) exists scattered across the OS, unreadable without specialized tools.

Suspicious activity — unauthorized file changes, unknown processes, brute-force login attempts — often goes undetected for weeks.

---

## 2. Solution

A locally hosted web application that acts as a **centralized security monitoring dashboard** — aggregating process data, file integrity checks, network scans, auth log analysis, and password evaluation into one unified interface, backed by Supabase for persistent storage and real-time alerts.

---

## 3. Goals

- Give non-technical users clear visibility into their system's security posture
- Detect anomalous activity early before it escalates
- Run entirely locally — backend binds to 127.0.0.1, no data sent externally
- Present complex security data in a simple, actionable format
- Persist all security events historically in Supabase for trend analysis

---

## 4. Target Users

| User Type | Description | Primary Need |
|---|---|---|
| Individual Users | Home computer users | Know if their system is compromised |
| Students | College/university users | Learn about system security |
| Small Teams | Orgs without IT security | Basic endpoint monitoring |
| Security Students | BCA/CS students, hackathon participants | Hands-on security tooling |

---

## 5. Functional Requirements

### 5.1 System Security Audit — P0 (Must Have)

| ID | Requirement |
|---|---|
| SA-01 | Display all currently running processes with PID, user, CPU%, memory% |
| SA-02 | List all open network ports with protocol and state |
| SA-03 | Display running system services and their status |
| SA-04 | Flag risky items: Telnet port open, unknown root process, disabled firewall |
| SA-05 | Allow manual refresh of audit data |
| SA-06 | Show timestamp of last audit run |

### 5.2 File Integrity Monitoring — P0 (Must Have)

| ID | Requirement |
|---|---|
| FI-01 | Allow user to add files or directories to a monitored watchlist |
| FI-02 | Compute and store SHA-256 baseline hash on addition (saved to Supabase) |
| FI-03 | Continuously watch monitored paths for changes using chokidar |
| FI-04 | Alert immediately when a hash mismatch is detected |
| FI-05 | Show original hash, new hash, and timestamp of change |
| FI-06 | Allow user to acknowledge/dismiss alerts |
| FI-07 | Allow user to remove files from watchlist |

### 5.3 Local Network Monitoring — P1 (Should Have)

| ID | Requirement |
|---|---|
| NM-01 | Scan LAN and list all connected devices |
| NM-02 | Display IP address and MAC address per device |
| NM-03 | Show device hostname where resolvable |
| NM-04 | Allow user to mark a device as known/trusted |
| NM-05 | Flag previously unseen devices as "unknown" |
| NM-06 | Show last seen timestamp per device |
| NM-07 | Manual rescan button |

### 5.4 Password Strength Analysis — P1 (Should Have)

| ID | Requirement |
|---|---|
| PS-01 | Accept masked password input |
| PS-02 | Evaluate: length, uppercase, lowercase, numbers, symbols |
| PS-03 | Check against top 10,000 common passwords list |
| PS-04 | Detect presence of dictionary words |
| PS-05 | Display strength score with visual meter |
| PS-06 | Provide specific improvement suggestions |
| PS-07 | Never log, store, or transmit the evaluated password |

### 5.5 Security Log Monitoring — P0 (Must Have)

| ID | Requirement |
|---|---|
| LM-01 | Parse system authentication logs in real time |
| LM-02 | Detect and display failed login attempts |
| LM-03 | Detect brute-force: 5+ failures from same IP within 60s |
| LM-04 | Detect invalid username login attempts |
| LM-05 | Assign severity: LOW / MEDIUM / HIGH / CRITICAL |
| LM-06 | Show timestamp, source IP, username, event type per entry |
| LM-07 | Trigger real-time alert on HIGH/CRITICAL events via Supabase Realtime |

### 5.6 Central Security Dashboard — P0 (Must Have)

| ID | Requirement |
|---|---|
| DB-01 | Display summary cards for all 5 modules on a single screen |
| DB-02 | Show active alert count per module |
| DB-03 | Consolidated alert feed sorted by severity and time |
| DB-04 | Color-coded alerts: green / yellow / red |
| DB-05 | Overall system health score |
| DB-06 | Navigation to detailed view of each module |
| DB-07 | Real-time updates without full page reload |

---

## 6. Non-Functional Requirements

| Category | Requirement |
|---|---|
| Performance | Dashboard loads within 2 seconds on localhost |
| Privacy | Passwords never logged or stored; all OS data stays local |
| Reliability | Backend handles OS command failures gracefully |
| Compatibility | Linux (primary), Windows (secondary), macOS (stretch) |
| Usability | Non-technical user understands dashboard without a manual |
| Security | Backend binds to 127.0.0.1 only |

---

## 7. Out of Scope (v1.0)

- Automated remediation (killing processes, blocking IPs)
- Cloud sync or remote monitoring
- Mobile app
- Email/SMS notifications
- Antivirus scanning
- CVE database lookup

---

## 8. Success Metrics

| Metric | Target |
|---|---|
| All 5 modules functional | 100% |
| File change detected within | < 5 seconds |
| Brute-force alert triggered | Yes (test: 6 failed logins) |
| Password catches top-1000 passwords | Yes |
| Unknown LAN device flagged | Yes |
| All events persisted in Supabase | Yes |
