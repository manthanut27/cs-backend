# 10 — Development Phases
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## Phase Overview

```
Day 1           Day 2               Day 3
│               │                   │
├─ Phase 1      ├─ Phase 3          ├─ Phase 5
│  Foundation   │  Network +        │  Polish +
│  + Audit      │  Password         │  Testing
│               │                   │
├─ Phase 2      ├─ Phase 4          └─ Demo Ready ✅
   File +          Frontend
   Logs             Dashboard
```

---

## Phase 1 — Foundation & System Audit
**Duration:** Day 1, Morning (4 hours)

### Tasks
- [ ] Initialize monorepo structure (`/client`, `/server`, `/docs`)
- [ ] Setup `server/index.js` — Express, CORS, dotenv
- [ ] Setup Supabase project — run SQL schema, enable Realtime
- [ ] Create `server/lib/supabase.js` client
- [ ] Implement `SystemService.js` — processes, ports, services
- [ ] Create `GET /api/audit` route
- [ ] Test audit endpoint with curl/Postman
- [ ] Implement `AlertService.js` — createAlert, getAlerts, acknowledgeAlert

### Deliverable
Working backend that returns system audit data as JSON.

---

## Phase 2 — File Integrity + Log Monitoring
**Duration:** Day 1, Afternoon (4 hours)

### Tasks
- [ ] Implement `FileService.js` — hashFile, addFile, checkFile, startWatcher
- [ ] Create `/api/integrity/*` routes (status, add, remove, history)
- [ ] Test: add a file, modify it, verify alert created in Supabase
- [ ] Implement `LogService.js` — Tail setup, PATTERNS, processLogLine
- [ ] Implement brute force detection (failureTracker)
- [ ] Create `GET /api/logs` route
- [ ] Test: manually add auth.log lines, verify events in Supabase

### Deliverable
File integrity monitoring fully working end-to-end with Supabase.  
Log monitoring reading and parsing auth.log entries.

---

## Phase 3 — Network Scanner + Password Checker
**Duration:** Day 2, Morning (3 hours)

### Tasks
- [ ] Implement `NetworkService.js` — ARP cache read, device upsert
- [ ] Add ping sweep as optional `?force=true` mode
- [ ] Create `/api/network/*` routes (scan, trust)
- [ ] Test: run scan, verify devices appear in Supabase
- [ ] Implement `PasswordService.js` — all 7 checks + zxcvbn + entropy
- [ ] Load `top10000passwords.json` dictionary
- [ ] Create `POST /api/password/check` route
- [ ] Test: verify weak/strong passwords return correct scores

### Deliverable
Network scanning returns LAN device list.  
Password checker correctly scores all strength levels.

---

## Phase 4 — React Frontend + Dashboard
**Duration:** Day 2, Afternoon → Day 3, Morning (8 hours)

### Tasks

#### Setup
- [ ] Init Vite React project in `/client`
- [ ] Install all frontend dependencies
- [ ] Setup Tailwind CSS, configure `tailwind.config.js`
- [ ] Setup React Router — 6 routes
- [ ] Setup Axios client, Supabase frontend client
- [ ] Build `Sidebar.jsx` with navigation + alert badges

#### Pages
- [ ] `DashboardPage` — 5 module cards + health score + alert feed
- [ ] `AuditPage` — process table + port table + risk flags
- [ ] `IntegrityPage` — watchlist table + add file form + change history
- [ ] `NetworkPage` — device table + trust button
- [ ] `PasswordPage` — password input + strength meter + checklist
- [ ] `LogsPage` — event table + severity filter

#### Realtime
- [ ] Implement `useRealtimeAlerts` hook (Supabase Realtime)
- [ ] Implement `useRealtimeLogs` hook
- [ ] Connect alert feed to realtime subscription
- [ ] Test: trigger alert, verify it appears in dashboard instantly

### Deliverable
Fully functional React dashboard — all 5 modules rendered with live data.

---

## Phase 5 — Polish, Testing & Demo Prep
**Duration:** Day 3 (4 hours)

### Tasks
- [ ] Add GSAP animations — sidebar entry, card load, alert pop-in
- [ ] Add loading states and error states to all API calls
- [ ] Add empty states (no alerts, no devices, no files)
- [ ] Implement `GET /api/health` endpoint
- [ ] Add overall health score computation and display
- [ ] Fix cross-platform issues (Windows path separators, log path)
- [ ] Write `README.md` — setup instructions
- [ ] Run full end-to-end test (see testing-strategy.md)
- [ ] Prepare demo script and sample data

### Deliverable
Production-ready demo. All modules working. Smooth UI. README complete.

---

## Milestone Summary

| Milestone | Phase | Done When |
|---|---|---|
| Backend boots, audit API responds | 1 | `GET /api/audit` returns JSON |
| File change triggers Supabase alert | 2 | Modify watched file → alert appears in DB |
| Log event detected and stored | 2 | Auth.log line → row in `auth_log_events` |
| Network devices visible | 3 | LAN scan → devices in `network_devices` table |
| Password check works | 3 | POST returns score + suggestions |
| Dashboard renders live data | 4 | All 5 module cards show real data |
| Realtime alert push works | 4 | New alert → appears on dashboard without reload |
| Demo ready | 5 | Full end-to-end flow works smoothly |
