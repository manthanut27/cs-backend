# 05 — Database Schema
## Personal Cybersecurity Toolkit — Hawkathon 2026

**Database:** Supabase (PostgreSQL)

---

## 1. Entity Relationship Overview

```
file_hashes ──────────────────────────────┐
    │ (1 file → many change events)        │
    ▼                                      │
file_change_events                         │
                                           ▼
                              security_alerts  ◄──── network_devices
                                    ▲                     │
                                    │                     │
                              auth_log_events             │
                              (brute force → alert)       │
```

---

## 2. Table Definitions

### 2.1 `file_hashes`
Stores baseline SHA-256 hashes for all monitored files.

```sql
CREATE TABLE file_hashes (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path     TEXT        NOT NULL UNIQUE,
  baseline_hash TEXT        NOT NULL,
  last_hash     TEXT,
  status        TEXT        DEFAULT 'clean'
                            CHECK (status IN ('clean', 'modified', 'missing')),
  added_at      TIMESTAMPTZ DEFAULT now(),
  last_checked  TIMESTAMPTZ DEFAULT now()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `file_path` | TEXT | Absolute path to monitored file |
| `baseline_hash` | TEXT | SHA-256 hash at time of registration |
| `last_hash` | TEXT | Most recently computed hash |
| `status` | TEXT | clean / modified / missing |
| `added_at` | TIMESTAMPTZ | When file was added to watchlist |
| `last_checked` | TIMESTAMPTZ | Last time hash was recomputed |

---

### 2.2 `file_change_events`
Immutable log of every detected file modification.

```sql
CREATE TABLE file_change_events (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  file_path    TEXT        NOT NULL,
  old_hash     TEXT,
  new_hash     TEXT,
  detected_at  TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN     DEFAULT false
);
```

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `file_path` | TEXT | Path of the changed file |
| `old_hash` | TEXT | Hash before change |
| `new_hash` | TEXT | Hash after change |
| `detected_at` | TIMESTAMPTZ | When change was detected |
| `acknowledged` | BOOLEAN | Whether user reviewed this event |

---

### 2.3 `security_alerts`
Central unified alert log from all 5 modules.

```sql
CREATE TABLE security_alerts (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  source       TEXT        NOT NULL
                           CHECK (source IN ('file_integrity','log_monitor','network','audit')),
  type         TEXT        NOT NULL,
  severity     TEXT        NOT NULL
                           CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  title        TEXT        NOT NULL,
  detail       TEXT,
  timestamp    TIMESTAMPTZ DEFAULT now(),
  acknowledged BOOLEAN     DEFAULT false
);
```

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `source` | TEXT | Which module generated this alert |
| `type` | TEXT | file_change / brute_force / unknown_device / open_port / failed_login |
| `severity` | TEXT | LOW / MEDIUM / HIGH / CRITICAL |
| `title` | TEXT | Human-readable alert title |
| `detail` | TEXT | Specific details (IP, path, hash, etc.) |
| `timestamp` | TIMESTAMPTZ | When alert was created |
| `acknowledged` | BOOLEAN | Whether user dismissed this alert |

---

### 2.4 `network_devices`
Registry of all devices ever seen on the local network.

```sql
CREATE TABLE network_devices (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address  TEXT        NOT NULL,
  mac_address TEXT        UNIQUE,
  hostname    TEXT,
  is_trusted  BOOLEAN     DEFAULT false,
  first_seen  TIMESTAMPTZ DEFAULT now(),
  last_seen   TIMESTAMPTZ DEFAULT now()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `ip_address` | TEXT | Current IP (may change via DHCP) |
| `mac_address` | TEXT | Unique hardware identifier |
| `hostname` | TEXT | Resolved hostname or 'unknown' |
| `is_trusted` | BOOLEAN | User-marked as trusted device |
| `first_seen` | TIMESTAMPTZ | First time this MAC was detected |
| `last_seen` | TIMESTAMPTZ | Most recent detection |

---

### 2.5 `auth_log_events`
Parsed suspicious events extracted from system authentication logs.

```sql
CREATE TABLE auth_log_events (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type  TEXT        NOT NULL,
  source_ip   TEXT,
  username    TEXT,
  severity    TEXT        CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  raw_line    TEXT,
  detected_at TIMESTAMPTZ DEFAULT now()
);
```

| Column | Type | Description |
|---|---|---|
| `id` | UUID | Primary key |
| `event_type` | TEXT | failedLogin / bruteForce / invalidUser / sudoFailed |
| `source_ip` | TEXT | IP address of the attacker |
| `username` | TEXT | Username targeted in the attempt |
| `severity` | TEXT | LOW / MEDIUM / HIGH / CRITICAL |
| `raw_line` | TEXT | Original log line for reference |
| `detected_at` | TIMESTAMPTZ | When the log line was processed |

---

## 3. Indexes

```sql
-- Fast alert queries by severity and time
CREATE INDEX idx_alerts_severity  ON security_alerts(severity);
CREATE INDEX idx_alerts_timestamp ON security_alerts(timestamp DESC);

-- Fast brute force detection queries
CREATE INDEX idx_auth_ip   ON auth_log_events(source_ip);
CREATE INDEX idx_auth_time ON auth_log_events(detected_at DESC);

-- Fast device lookup by MAC
CREATE INDEX idx_network_mac ON network_devices(mac_address);

-- Fast file lookup
CREATE INDEX idx_file_path ON file_hashes(file_path);
```

---

## 4. Realtime Configuration

Enable Realtime on these tables in Supabase Dashboard → Database → Replication:

| Table | Events | Reason |
|---|---|---|
| `security_alerts` | INSERT | Push new alerts to dashboard immediately |
| `auth_log_events` | INSERT | Push new log events to logs page |
| `network_devices` | INSERT | Push new device detection |
| `file_change_events` | INSERT | Push file modification events |

---

## 5. Row Level Security (RLS)

Since this app is local-only, enable RLS with an open policy for the anon key:

```sql
-- Allow anon key full access (local app only)
ALTER TABLE file_hashes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_change_events  ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_alerts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_devices     ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_log_events     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for anon" ON file_hashes        FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON file_change_events FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON security_alerts    FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON network_devices    FOR ALL USING (true);
CREATE POLICY "Allow all for anon" ON auth_log_events    FOR ALL USING (true);
```

---

## 6. Severity Assignment Rules

| Event | Severity |
|---|---|
| System file changed (/etc/*) | CRITICAL |
| User file changed | HIGH |
| Brute force (5+ failures / 60s) | CRITICAL |
| Single failed login | LOW |
| Invalid username attempt | MEDIUM |
| New unknown device on LAN | MEDIUM |
| Risky port open (21, 23, 445) | HIGH |
