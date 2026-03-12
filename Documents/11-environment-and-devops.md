# 11 — Environment & DevOps
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.x LTS | Backend runtime |
| npm | 9.x+ | Package management |
| Git | Any | Version control |
| Supabase account | Free | Cloud PostgreSQL + Realtime |

---

## 2. Environment Variables

### `server/.env`
```env
# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# App Config
PORT=3001
LOG_PATH=/var/log/auth.log
SCAN_INTERVAL_AUDIT=60000
SCAN_INTERVAL_NETWORK=120000
NODE_ENV=development
```

### `client/.env`
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://localhost:3001
```

> ⚠️ Never commit `.env` files to Git. Both are in `.gitignore`.

---

## 3. First-Time Setup

```bash
# 1. Clone repo
git clone https://github.com/your-username/cybersec-toolkit.git
cd cybersec-toolkit

# 2. Install root + server dependencies
npm install
cd server && npm install && cd ..

# 3. Install frontend dependencies
cd client && npm install && cd ..

# 4. Setup Supabase
#    - Go to https://supabase.com → New Project
#    - Copy SQL from docs/05-database-schema.md → SQL Editor → Run
#    - Enable Realtime on all 5 tables
#    - Copy Project URL + anon key into .env files

# 5. Configure environment
cp server/.env.example server/.env
cp client/.env.example client/.env
# Edit both files with your Supabase credentials

# 6. Fix log file permissions (Linux)
sudo chmod a+r /var/log/auth.log
```

---

## 4. Development Mode

```bash
# Start both frontend and backend together
npm run dev

# Or separately:
npm run dev:server   # Backend on http://localhost:3001
npm run dev:client   # Frontend on http://localhost:5173 (with HMR)
```

Vite proxies `/api` requests to `localhost:3001` automatically (see `vite.config.js`).

---

## 5. Production Build

```bash
# Build React frontend
npm run build
# → Outputs to client/dist/

# Start production server
npm start
# → Serves frontend from /client/dist
# → API available at /api/*
# → Open http://localhost:3001
```

---

## 6. Windows Compatibility

`SystemService.js` uses OS detection to swap commands:

```javascript
const isWindows = process.platform === 'win32';

async function getProcesses() {
  const cmd = isWindows ? 'tasklist /fo csv /nh' : 'ps aux --no-headers';
  // parse differently per OS
}

async function getOpenPorts() {
  const cmd = isWindows ? 'netstat -ano' : 'netstat -tuln';
}
```

**Windows log path** — update in `server/.env`:
```env
LOG_PATH=C:\Windows\System32\winevt\Logs\Security.evtx
```
(Requires PowerShell fallback in LogService for Windows Event Log)

---

## 7. `.gitignore`

```
node_modules/
client/dist/
server/.env
client/.env
*.log
.DS_Store
```

---

## 8. Recommended VS Code Extensions

```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "supabase.supabase-vscode"
  ]
}
```

---

## 9. Supabase Dashboard Checklist

After creating your project, verify:

- [ ] All 5 tables exist (run schema SQL)
- [ ] Realtime enabled: `security_alerts`, `auth_log_events`, `network_devices`, `file_change_events`
- [ ] RLS policies created (open policy for anon key)
- [ ] API URL and anon key copied to both `.env` files
- [ ] Connection test: `node server/lib/supabase.js` (runs a test query)

---

## 10. Useful Commands During Development

```bash
# Check if backend is running
curl http://localhost:3001/api/health

# Test audit endpoint
curl http://localhost:3001/api/audit | python3 -m json.tool

# Test password checker
curl -X POST http://localhost:3001/api/password/check \
  -H "Content-Type: application/json" \
  -d '{"password":"test123"}' | python3 -m json.tool

# Simulate file change alert (Linux)
echo "test" >> /tmp/testfile.txt  # if /tmp/testfile.txt is monitored

# View Supabase logs live
# → Go to Supabase Dashboard → Logs → Realtime
```
