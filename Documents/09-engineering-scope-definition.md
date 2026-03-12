# 09 — Engineering Scope Definition
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. In Scope (Must Build)

### Backend
- Express.js REST API server with all 6 route modules
- SystemService — OS process/port/service reading via `systeminformation`
- FileService — SHA-256 hashing + chokidar file watcher + Supabase writes
- NetworkService — ARP scan + ping sweep + device upsert to Supabase
- PasswordService — entropy calculation + zxcvbn integration + dictionary check
- LogService — auth.log tail + pattern matching + brute force detection
- AlertService — unified alert writer to Supabase
- ScoringService — health score computation from active alerts
- Supabase client setup and all 5 table interactions

### Frontend
- React SPA with React Router (6 pages)
- Dashboard with module cards, health score, and realtime alert feed
- System Audit page with process/port/service tables
- File Integrity page with watchlist management and change history
- Network Monitor page with device table and trust controls
- Password Checker page with strength meter and suggestions
- Logs page with event table and severity filters
- Supabase Realtime hooks for alerts and log events
- Sidebar navigation with active alert badges
- Responsive layout with Tailwind CSS

### Database
- All 5 Supabase tables created with correct schema
- Indexes on high-query columns
- RLS policies configured
- Realtime enabled on alert and event tables

---

## 2. Out of Scope (Will NOT Build in v1.0)

| Feature | Reason |
|---|---|
| User authentication / login | Local-only app, OS is the auth boundary |
| Automated threat remediation | Outside hackathon scope |
| Email / SMS notifications | Needs external service setup |
| Mobile responsive design | Desktop-only tool |
| macOS full support | Linux + Windows primary targets |
| CVE vulnerability database lookup | Requires external API |
| Multi-user / multi-machine support | Single-user local tool |
| Historical trend charts | Nice-to-have, post-hackathon |
| Docker containerization | Not needed for local demo |
| CI/CD pipeline | Not required for hackathon |

---

## 3. Technical Constraints

| Constraint | Detail |
|---|---|
| Local-only backend | Server binds to 127.0.0.1 — not network accessible |
| Password never persisted | Evaluated in memory, never written to DB or logs |
| OS compatibility | Primary: Linux. Windows requires command substitution in SystemService |
| Supabase free tier limits | 500MB DB, 2GB bandwidth — more than sufficient |
| Node.js version | 20.x LTS required for `systeminformation` compatibility |
| Read-only OS access | All OS commands are read-only (ps, netstat, arp, cat) — no system modifications |

---

## 4. Dependencies Summary

### Backend `package.json`
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "dotenv": "^16.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "systeminformation": "^5.21.0",
    "node-arp": "^1.0.6",
    "ping": "^0.4.4",
    "chokidar": "^3.5.3",
    "tail": "^2.2.4",
    "zxcvbn": "^4.4.2",
    "uuid": "^9.0.0"
  }
}
```

### Frontend `package.json`
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "@supabase/supabase-js": "^2.0.0",
    "axios": "^1.6.0",
    "gsap": "^3.12.0",
    "lucide-react": "^0.383.0",
    "recharts": "^2.12.0",
    "dayjs": "^1.11.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

---

## 5. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `/var/log/auth.log` not accessible | Medium | High | Check file permissions on startup, show clear error |
| `systeminformation` behaves differently on Windows | High | Medium | Abstract into OS-detection wrapper |
| Supabase free tier rate limits | Low | Medium | Batch writes, avoid per-line DB inserts in log service |
| chokidar misses changes on some filesystems | Low | High | Add periodic hash re-check every 5 minutes as fallback |
| Ping sweep too slow for demo | Medium | Low | Default to ARP cache only, make sweep optional |
| Large auth.log file on first run | Medium | Low | Skip historical lines, start tailing from EOF |
