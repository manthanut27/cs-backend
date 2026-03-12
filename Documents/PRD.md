# Product Requirements Document (PRD)
## Personal Cybersecurity Toolkit — Hawkathon 2026

**Version:** 1.0  
**Date:** March 2026  
**Track:** Cybersecurity — Endpoint Protection

---

## 1. Product Overview

### 1.1 Problem Statement

Personal computers handle communication, financial transactions, sensitive storage, and development work — yet most users have zero visibility into their system's security state. Security-relevant data (logs, processes, network activity, file changes) exists scattered across the OS, unreadable without specialized tools.

Suspicious activity — unauthorized file changes, unknown processes, brute-force login attempts — often goes undetected for weeks.

### 1.2 Solution

A locally hosted web application that acts as a **centralized security monitoring dashboard** — aggregating process data, file integrity checks, network scans, auth log analysis, and password evaluation into one unified interface.

### 1.3 Goals

- Give non-technical users clear visibility into their system's security posture
- Detect anomalous activity early before it escalates
- Run entirely locally — no cloud dependency, no data exfiltration
- Present complex security data in a simple, actionable format

---

## 2. Target Users

| User Type | Description | Primary Need |
|---|---|---|
| Individual Users | Home computer users | Know if their system is compromised |
| Students | College/university users | Learn about system security |
| Small Teams | Orgs without IT security | Basic endpoint monitoring |
| Security Students | BCA/CS students, hackathon participants | Hands-on security tooling |

---

## 3. Functional Requirements

### 3.1 System Security Audit

**Priority: P0 (Must Have)**

| ID | Requirement |
|---|---|
| SA-01 | Display list of all currently running processes with PID, user, CPU%, memory% |
| SA-02 | List all open network ports with protocol and state |
| SA-03 | Display running system services and their status |
| SA-04 | Flag potentially risky items (e.g., Telnet port open, unknown root process) |
| SA-05 | Allow manual refresh of audit data |
| SA-06 | Show timestamp of last audit run |

**Risk flags to detect:**
- Ports 23 (Telnet), 21 (FTP), 445 (SMB) open
- Processes running as root with unrecognized names
- Disabled firewall status

---

### 3.2 File Integrity Monitoring

**Priority: P0 (Must Have)**

| ID | Requirement |
|---|---|
| FI-01 | Allow user to add files or directories to a monitored watchlist |
| FI-02 | Compute and store SHA-256 baseline hash on addition |
| FI-03 | Continuously watch monitored paths for changes |
| FI-04 | Alert immediately when a hash mismatch is detected |
| FI-05 | Show original hash, new hash, and timestamp of change |
| FI-06 | Allow user to acknowledge/dismiss alerts after review |
| FI-07 | Allow user to remove files from watchlist |

---

### 3.3 Local Network Monitoring

**Priority: P1 (Should Have)**

| ID | Requirement |
|---|---|
| NM-01 | Scan LAN and list all connected devices |
| NM-02 | Display IP address and MAC address for each device |
| NM-03 | Show device hostname where resolvable |
| NM-04 | Allow user to mark a device as "known/trusted" |
| NM-05 | Flag devices not previously seen as "unknown" |
| NM-06 | Show last seen timestamp per device |
| NM-07 | Manual rescan button |

---

### 3.4 Password Strength Analysis

**Priority: P1 (Should Have)**

| ID | Requirement |
|---|---|
| PS-01 | Accept password input via text field (masked) |
| PS-02 | Evaluate: length, uppercase, lowercase, numbers, symbols |
| PS-03 | Check against list of top 10,000 common passwords |
| PS-04 | Detect presence of dictionary words |
| PS-05 | Display a strength score with visual indicator (0–100 or label) |
| PS-06 | Provide specific improvement suggestions |
| PS-07 | Never log, store, or transmit the evaluated password |

---

### 3.5 Security Log Monitoring

**Priority: P0 (Must Have)**

| ID | Requirement |
|---|---|
| LM-01 | Parse system authentication logs in real time |
| LM-02 | Detect and display failed login attempts |
| LM-03 | Detect brute-force patterns (5+ failures from same IP in 60s) |
| LM-04 | Detect invalid username login attempts |
| LM-05 | Assign severity levels: LOW / MEDIUM / HIGH / CRITICAL |
| LM-06 | Show timestamp, source IP, username, and event type per entry |
| LM-07 | Trigger real-time alert to dashboard on HIGH/CRITICAL events |

---

### 3.6 Central Security Dashboard

**Priority: P0 (Must Have)**

| ID | Requirement |
|---|---|
| DB-01 | Display summary cards for all 5 modules on a single screen |
| DB-02 | Show active alert count per module |
| DB-03 | Provide a consolidated alert feed sorted by severity and time |
| DB-04 | Color-code alerts: green (safe), yellow (warning), red (critical) |
| DB-05 | Show overall system health score as a percentage or rating |
| DB-06 | Allow navigation to detailed view of each module |
| DB-07 | Update in real-time without full page reload |

---

## 4. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Dashboard must load within 2 seconds on localhost |
| **Privacy** | All data stays local — no external API calls except for optional CVE lookups |
| **Reliability** | Backend must handle OS command failures gracefully without crashing |
| **Compatibility** | Must work on Linux and Windows; macOS as stretch goal |
| **Usability** | A non-technical user must understand the dashboard without a manual |
| **Security** | Backend must bind to 127.0.0.1 only — not exposed to network |

---

## 5. Out of Scope (v1.0)

- Automated remediation (killing processes, blocking IPs)
- Cloud sync or remote monitoring
- Mobile app
- Email/SMS alert notifications
- Antivirus scanning
- Vulnerability CVE database lookup

---

## 6. Success Metrics

| Metric | Target |
|---|---|
| All 5 modules functional | 100% |
| Dashboard renders all module data | Yes |
| File change detected within | < 5 seconds |
| Brute-force alert triggered correctly | Yes (test case: 6 failed logins) |
| Password checker catches top-1000 passwords | Yes |
| Unknown LAN device flagged | Yes |

---

## 7. Milestones

| Phase | Deliverable | Timeline |
|---|---|---|
| Phase 1 | Backend scaffold + System Audit API | Day 1 |
| Phase 2 | File Integrity + Log Monitor services | Day 1–2 |
| Phase 3 | Network Scanner + Password Checker | Day 2 |
| Phase 4 | React Dashboard + module UIs | Day 2–3 |
| Phase 5 | WebSocket real-time alerts | Day 3 |
| Phase 6 | Polish, testing, demo prep | Day 3 |
