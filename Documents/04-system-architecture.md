# 04 — System Architecture
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Architecture Overview

The toolkit is a **locally hosted full-stack web application** with three tiers:

```
┌─────────────────────────────────────────────────────────────┐
│                     TIER 1: FRONTEND                        │
│            React SPA (Vite + Tailwind + GSAP)               │
│                    localhost:5173 (dev)                     │
│                    localhost:3001 (prod)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP REST + Supabase Realtime WS
┌──────────────────────▼──────────────────────────────────────┐
│                     TIER 2: BACKEND                         │
│              Node.js + Express API Server                   │
│                    localhost:3001                           │
│                                                             │
│   ┌───────────┐ ┌───────────┐ ┌──────────┐ ┌──────────┐   │
│   │SystemSvc  │ │NetworkSvc │ │FileSvc   │ │LogSvc    │   │
│   └───────────┘ └───────────┘ └──────────┘ └──────────┘   │
│                  ┌──────────────┐                           │
│                  │PasswordSvc   │                           │
│                  └──────────────┘                           │
└──────────────────────┬──────────────────────────────────────┘
          ┌────────────┴──────────────┐
          │                           │
┌─────────▼──────────┐   ┌───────────▼───────────────────────┐
│  TIER 3A: OS LAYER │   │  TIER 3B: SUPABASE (Cloud DB)     │
│                    │   │                                    │
│  /proc, ps, arp,   │   │  file_hashes                      │
│  netstat, auth.log │   │  file_change_events               │
│  filesystem        │   │  security_alerts                  │
└────────────────────┘   │  network_devices                  │
                         │  auth_log_events                  │
                         │                                    │
                         │  + Realtime WebSocket push        │
                         └───────────────────────────────────┘
```

---

## 2. Layer Breakdown

### 2.1 Frontend Layer

**Tech:** React 18, Vite 5, Tailwind CSS 3, GSAP 3, React Router 6

| Component | Route | Responsibility |
|---|---|---|
| `DashboardPage` | `/` | Summary cards, health score, alert feed |
| `AuditPage` | `/audit` | Processes, ports, services, risk flags |
| `IntegrityPage` | `/integrity` | File watchlist, hash comparison, change history |
| `NetworkPage` | `/network` | LAN device table, trust management |
| `PasswordPage` | `/password` | Password input, strength meter, suggestions |
| `LogsPage` | `/logs` | Auth event table, brute force alerts |

**State:** React Context API for global alerts and module status  
**Realtime:** `@supabase/supabase-js` Realtime subscriptions for `security_alerts` and `auth_log_events`  
**Polling:** `usePolling` hook — 60s for audit, 120s for network, on-demand for password

---

### 2.2 Backend Layer

**Tech:** Node.js 20, Express 4, @supabase/supabase-js, systeminformation, chokidar, tail

| Service | Responsibility | Key Libraries |
|---|---|---|
| `SystemService` | Reads processes, ports, services from OS | `systeminformation` |
| `NetworkService` | ARP cache scan + ping sweep + upserts to Supabase | `node-arp`, `ping` |
| `FileService` | SHA-256 hashing, chokidar file watcher, hash diff | `chokidar`, `crypto` |
| `PasswordService` | Entropy calc, dictionary check, zxcvbn scoring | `zxcvbn` |
| `LogService` | Tails auth.log, pattern matches, brute force detection | `tail` |
| `AlertService` | Central alert writer to Supabase | `@supabase/supabase-js` |

---

### 2.3 Database Layer (Supabase)

**Tech:** Supabase (PostgreSQL + Realtime)

| Table | Written By | Read By |
|---|---|---|
| `file_hashes` | FileService | IntegrityPage |
| `file_change_events` | FileService | IntegrityPage, AlertFeed |
| `security_alerts` | AlertService (all modules) | Dashboard, all pages |
| `network_devices` | NetworkService | NetworkPage |
| `auth_log_events` | LogService | LogsPage |

**Realtime subscriptions active on:** `security_alerts` (INSERT), `auth_log_events` (INSERT)

---

## 3. Communication Patterns

### REST (Polling — non-critical data)
```
Frontend ──GET /api/audit (every 60s)──► Backend ──► SystemService ──► OS
Frontend ◄── JSON ──────────────────── Backend
```

### Supabase Realtime (Push — critical events)
```
Backend ──INSERT──► Supabase DB ──► Realtime WS ──► Frontend
                                                    (instant, no polling)
```

### On-Demand (Password check)
```
Frontend ──POST /api/password/check──► Backend ──► PasswordService
Frontend ◄── { score, checks, suggestions } ──────
```

---

## 4. Security Boundaries

| Boundary | Control |
|---|---|
| Backend network binding | `127.0.0.1` only — not LAN accessible |
| Supabase access | Anon key with Row Level Security (RLS) scoped to local user |
| Password handling | Never logged, never stored, evaluated in-memory only |
| Log file access | Read-only file handles |
| OS command execution | Sandboxed to read-only system commands only |

---

## 5. Deployment Model

```bash
# Single command startup (production)
npm start
# → Express serves React build from /client/dist
# → Express API available at /api/*
# → Open http://localhost:3001
```

```bash
# Development (two processes)
npm run dev:server   # Backend on :3001
npm run dev:client   # Vite HMR on :5173
```
