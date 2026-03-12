# 02 — User Stories & Acceptance Criteria
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## Epic 1: System Security Audit

### US-SA-01: View Running Processes
**As a** user, **I want to** see all processes currently running on my machine **so that** I can identify unfamiliar or suspicious background programs.

**Acceptance Criteria:**
- Dashboard shows a table of processes with: PID, User, CPU%, Memory%, Command
- Table updates on manual refresh click
- Processes running as root are highlighted in yellow
- Unrecognized process names are flagged with a warning icon

---

### US-SA-02: View Open Ports
**As a** user, **I want to** see all open network ports **so that** I can identify unnecessary exposed services.

**Acceptance Criteria:**
- Lists each port with: Protocol, Port Number, State (LISTEN/ESTABLISHED)
- Ports 21, 23, 445 automatically flagged as HIGH risk
- Unknown ports above 1024 flagged as MEDIUM risk
- Timestamp of last scan shown

---

## Epic 2: File Integrity Monitoring

### US-FI-01: Add File to Watchlist
**As a** user, **I want to** add any file or folder to a monitoring watchlist **so that** I am alerted if it changes unexpectedly.

**Acceptance Criteria:**
- User can type or paste a file path and click "Add"
- System computes SHA-256 hash immediately and stores it in Supabase
- File appears in watchlist table with status "Clean" and green badge
- Error shown if file does not exist or is unreadable

---

### US-FI-02: Detect File Modification
**As a** user, **I want to** be automatically notified when a monitored file changes **so that** I can investigate potential tampering.

**Acceptance Criteria:**
- Alert appears within 5 seconds of file modification
- Alert shows: file path, old hash, new hash, timestamp
- Alert severity set to HIGH for user files, CRITICAL for system files (/etc/*)
- Alert persisted to Supabase `file_change_events` table
- Dashboard alert count increments immediately

---

### US-FI-03: Acknowledge File Alert
**As a** user, **I want to** dismiss a file change alert after reviewing it **so that** my alert feed stays clean.

**Acceptance Criteria:**
- Each alert has an "Acknowledge" button
- Acknowledged alerts are marked in Supabase (`acknowledged = true`)
- Dashboard alert count decrements after acknowledgment
- Acknowledged alerts move to a separate "Resolved" view

---

## Epic 3: Network Monitoring

### US-NM-01: Scan Local Network
**As a** user, **I want to** see all devices connected to my local network **so that** I can spot unauthorized devices.

**Acceptance Criteria:**
- Network scan runs on page load and on manual trigger
- Each device listed with: IP, MAC address, Hostname (if resolvable), Last Seen
- Scan completes within 30 seconds
- Partial results shown while scan is in progress

---

### US-NM-02: Flag Unknown Devices
**As a** user, **I want** new/unknown devices to be automatically flagged **so that** I notice unauthorized network access.

**Acceptance Criteria:**
- First-time devices get a MEDIUM severity alert
- Unknown devices shown with red "Unknown" badge
- Alert persisted to Supabase `security_alerts` table
- User can click "Trust Device" to mark it as known

---

## Epic 4: Password Strength

### US-PS-01: Check Password Strength
**As a** user, **I want to** test how strong my passwords are **so that** I can improve weak ones.

**Acceptance Criteria:**
- Password input field is masked by default with show/hide toggle
- Strength evaluated in real-time as user types (debounced 300ms)
- Visual strength bar shown (red → orange → yellow → green)
- Strength label shown: Weak / Fair / Good / Strong / Very Strong
- Password is never sent to any external server
- Password is never logged in backend

---

### US-PS-02: Get Improvement Suggestions
**As a** user, **I want to** receive specific feedback on what makes my password weak **so that** I know exactly how to improve it.

**Acceptance Criteria:**
- Suggestions shown as checklist: ✅ Has uppercase / ❌ Too short / etc.
- Common password warning shown if password is in top-10,000 list
- Dictionary word warning shown if password contains common words
- Entropy score shown in bits

---

## Epic 5: Security Log Monitoring

### US-LM-01: View Auth Log Events
**As a** user, **I want to** see suspicious authentication events from my system logs **so that** I can identify login attacks.

**Acceptance Criteria:**
- Logs page shows events with: timestamp, event type, source IP, username, severity
- Events color-coded by severity
- Newest events appear at top
- Last 100 events loaded from Supabase on page open

---

### US-LM-02: Brute Force Detection
**As a** user, **I want to** be alerted automatically when a brute-force attack pattern is detected **so that** I can react quickly.

**Acceptance Criteria:**
- CRITICAL alert triggered after 5+ failed logins from same IP within 60 seconds
- Alert shows: attacker IP, number of attempts, time window
- Alert appears in dashboard alert feed within 5 seconds
- Alert persisted to Supabase `security_alerts`

---

## Epic 6: Dashboard

### US-DB-01: View Security Overview
**As a** user, **I want to** see the overall security status of my system at a glance **so that** I quickly know if something is wrong.

**Acceptance Criteria:**
- Dashboard shows 5 module summary cards
- Each card shows: module name, status (Safe/Warning/Critical), active alert count
- Overall health score shown as percentage
- Page loads within 2 seconds

---

### US-DB-02: Real-time Alert Feed
**As a** user, **I want** new security alerts to appear on the dashboard instantly **so that** I don't miss critical events.

**Acceptance Criteria:**
- New alerts appear without page reload via Supabase Realtime
- CRITICAL alerts shown with red background and sound/visual pulse
- Alert feed sorted by severity then timestamp
- Each alert shows: source module, type, detail, time ago
