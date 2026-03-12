# 07 — Monorepo Structure
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Full Directory Tree

```
cybersec-toolkit/
│
├── package.json                    ← Root package (workspaces + scripts)
├── .env                            ← Root env (Supabase keys)
├── .gitignore
├── README.md
│
├── client/                         ── FRONTEND (React + Vite) ──────────────
│   ├── package.json
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env                        ← VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
│   │
│   └── src/
│       ├── main.jsx                ← React root, Supabase provider
│       ├── App.jsx                 ← Router setup
│       │
│       ├── pages/
│       │   ├── DashboardPage.jsx
│       │   ├── AuditPage.jsx
│       │   ├── IntegrityPage.jsx
│       │   ├── NetworkPage.jsx
│       │   ├── PasswordPage.jsx
│       │   └── LogsPage.jsx
│       │
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Sidebar.jsx
│       │   │   ├── TopBar.jsx
│       │   │   └── Layout.jsx
│       │   ├── dashboard/
│       │   │   ├── ModuleCard.jsx
│       │   │   ├── HealthScore.jsx
│       │   │   └── AlertFeed.jsx
│       │   ├── shared/
│       │   │   ├── SeverityBadge.jsx
│       │   │   ├── LoadingSpinner.jsx
│       │   │   ├── EmptyState.jsx
│       │   │   └── ErrorBanner.jsx
│       │   ├── audit/
│       │   │   ├── ProcessTable.jsx
│       │   │   ├── PortTable.jsx
│       │   │   └── RiskFlagList.jsx
│       │   ├── integrity/
│       │   │   ├── WatchlistTable.jsx
│       │   │   ├── AddFileForm.jsx
│       │   │   └── ChangeHistoryTable.jsx
│       │   ├── network/
│       │   │   ├── DeviceTable.jsx
│       │   │   └── TrustButton.jsx
│       │   ├── password/
│       │   │   ├── PasswordInput.jsx
│       │   │   └── StrengthMeter.jsx
│       │   └── logs/
│       │       ├── LogEventTable.jsx
│       │       └── BruteForceAlert.jsx
│       │
│       ├── hooks/
│       │   ├── usePolling.js       ← Generic interval-based fetch
│       │   ├── useRealtimeAlerts.js ← Supabase Realtime subscription
│       │   └── useRealtimeLogs.js  ← Supabase Realtime for log events
│       │
│       ├── context/
│       │   └── SecurityContext.jsx ← Global alerts + module statuses
│       │
│       ├── api/
│       │   └── client.js           ← Axios instance (baseURL: localhost:3001)
│       │
│       ├── lib/
│       │   └── supabase.js         ← Supabase client (frontend)
│       │
│       └── utils/
│           ├── severity.js         ← Color/label helpers
│           └── time.js             ← dayjs formatters
│
├── server/                         ── BACKEND (Node.js + Express) ──────────
│   ├── package.json
│   ├── index.js                    ← Express app entry, mounts routes
│   │
│   ├── routes/
│   │   ├── audit.js                ← GET /api/audit
│   │   ├── network.js              ← GET /api/network/scan, PATCH /trust
│   │   ├── integrity.js            ← GET/POST/DELETE /api/integrity/*
│   │   ├── password.js             ← POST /api/password/check
│   │   ├── logs.js                 ← GET /api/logs
│   │   └── alerts.js               ← GET/PATCH /api/alerts/*
│   │
│   ├── services/
│   │   ├── SystemService.js        ← systeminformation: processes, ports, services
│   │   ├── NetworkService.js       ← node-arp + ping sweep + Supabase upsert
│   │   ├── FileService.js          ← crypto SHA-256 + chokidar watcher
│   │   ├── PasswordService.js      ← zxcvbn + custom checks
│   │   ├── LogService.js           ← tail + regex patterns + brute force detection
│   │   └── AlertService.js         ← Supabase alert writer (used by all services)
│   │
│   ├── lib/
│   │   └── supabase.js             ← Supabase client (backend, uses service key)
│   │
│   ├── utils/
│   │   ├── riskRules.js            ← Port/process risk flag definitions
│   │   └── logger.js               ← Console logger with timestamps
│   │
│   └── data/
│       ├── top10000passwords.json  ← Common password list for checker
│       └── config.json             ← App config (log path, scan intervals)
│
└── docs/                           ── PROJECT DOCUMENTATION ────────────────
    ├── 01-product-requirements.md
    ├── 02-user-stories-and-acceptance-criteria.md
    ├── 03-information-architecture.md
    ├── 04-system-architecture.md
    ├── 05-database-schema.md
    ├── 06-api-contracts.md
    ├── 07-monorepo-structure.md
    ├── 08-scoring-engine-spec.md
    ├── 09-engineering-scope-definition.md
    ├── 10-development-phases.md
    ├── 11-environment-and-devops.md
    └── 12-testing-strategy.md
```

---

## 2. Root `package.json`

```json
{
  "name": "cybersec-toolkit",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently \"npm run dev:server\" \"npm run dev:client\"",
    "dev:server": "cd server && nodemon index.js",
    "dev:client": "cd client && vite",
    "build": "cd client && vite build",
    "start": "cd server && node index.js",
    "test": "npm run test --workspaces"
  },
  "devDependencies": {
    "concurrently": "^8.x",
    "nodemon": "^3.x"
  }
}
```

---

## 3. Key Config Files

### `client/vite.config.js`
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'  // Dev proxy to backend
    }
  }
});
```

### `server/index.js` (entry point)
```javascript
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/audit',     require('./routes/audit'));
app.use('/api/network',   require('./routes/network'));
app.use('/api/integrity', require('./routes/integrity'));
app.use('/api/password',  require('./routes/password'));
app.use('/api/logs',      require('./routes/logs'));
app.use('/api/alerts',    require('./routes/alerts'));

// Serve React build in production
app.use(express.static(path.join(__dirname, '../client/dist')));
app.get('*', (req, res) =>
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
);

// Start services
require('./services/FileService').startAllWatchers();
require('./services/LogService').startLogTail();

app.listen(3001, '127.0.0.1', () =>
  console.log('CyberSec Toolkit running on http://localhost:3001')
);
```
