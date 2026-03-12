# 12 — Testing Strategy
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Testing Approach

Since this is a hackathon project, the focus is on **manual end-to-end tests** that prove each module works during the demo. Automated unit tests are included for the scoring engine and password checker where logic is most critical.

---

## 2. Manual Test Cases

### Module 1: System Audit

| Test | Steps | Expected Result | Pass/Fail |
|---|---|---|---|
| SA-T01: Processes load | Open /audit page | Table shows all running processes with PID, user, CPU%, command | |
| SA-T02: Open ports shown | Open /audit page | Port table shows all LISTEN ports | |
| SA-T03: Risk flag — Telnet | Run `nc -l 23` or install telnet | Port 23 flagged as HIGH risk in red | |
| SA-T04: Manual refresh | Click refresh button | Timestamp updates, data refreshes | |
| SA-T05: Unknown process flag | Run a script with unusual name | Process appears with warning badge | |

---

### Module 2: File Integrity

| Test | Steps | Expected Result | Pass/Fail |
|---|---|---|---|
| FI-T01: Add file | Type `/tmp/test.txt`, click Add | File appears in watchlist with status "Clean" | |
| FI-T02: Detect modification | `echo "changed" >> /tmp/test.txt` | Alert appears on dashboard within 5 seconds | |
| FI-T03: Hash mismatch shown | View alert | Old hash and new hash both displayed | |
| FI-T04: Supabase write | Check Supabase table | Row in `file_change_events` with correct hashes | |
| FI-T05: Acknowledge alert | Click Acknowledge | Alert removed from feed, marked in DB | |
| FI-T06: System file CRITICAL | Monitor `/etc/hosts`, modify it | Severity shown as CRITICAL (not HIGH) | |
| FI-T07: Remove from watchlist | Click remove | File removed from table, watcher stopped | |

---

### Module 3: Network Monitor

| Test | Steps | Expected Result | Pass/Fail |
|---|---|---|---|
| NM-T01: Devices listed | Open /network page | Table shows all LAN devices with IP + MAC | |
| NM-T02: Router recognized | Check device list | Router IP shown (likely 192.168.x.1) | |
| NM-T03: Unknown device alert | Connect new device to WiFi | MEDIUM alert created, device flagged "Unknown" | |
| NM-T04: Trust device | Click "Trust" on a device | `is_trusted = true` in Supabase, badge updates | |
| NM-T05: Manual rescan | Click Rescan | Device list refreshes | |

---

### Module 4: Password Checker

| Test | Password | Expected Strength | Pass/Fail |
|---|---|---|---|
| PS-T01: Very weak | `123456` | Weak — flagged as common password | |
| PS-T02: Weak | `password` | Weak — dictionary word detected | |
| PS-T03: Fair | `Password1` | Fair — missing symbols | |
| PS-T04: Strong | `C0rr3ct!H0rse` | Strong | |
| PS-T05: Very strong | `xK9#mP2@wL5$nQ8!` | Very Strong | |
| PS-T06: Not stored | Check server logs | Password never appears in any log output | |
| PS-T07: Entropy shown | Any password | Entropy displayed in bits | |

---

### Module 5: Security Log Monitor

| Test | Steps | Expected Result | Pass/Fail |
|---|---|---|---|
| LM-T01: Events load | Open /logs page | Recent auth events shown from Supabase | |
| LM-T02: Failed login detected | `sudo -u baduser echo` or check existing logs | Event appears in table with source IP | |
| LM-T03: Brute force alert | Add 6 identical failed login lines to test log | CRITICAL alert fires after 5th failure | |
| LM-T04: Severity filter | Select HIGH filter | Only HIGH/CRITICAL events shown | |
| LM-T05: Realtime push | Trigger a log event | Appears in table without page refresh | |

---

### Module 6: Dashboard

| Test | Steps | Expected Result | Pass/Fail |
|---|---|---|---|
| DB-T01: All module cards | Open dashboard | 5 cards visible with status indicators | |
| DB-T02: Health score | Have 2 unacknowledged alerts | Score below 100%, label reflects risk level | |
| DB-T03: Realtime alert | Trigger file change | Alert appears in feed without page reload | |
| DB-T04: Alert count badge | Create 3 alerts | Sidebar badge shows "3" for affected module | |
| DB-T05: Navigate to module | Click module card | Routes to correct detail page | |

---

## 3. Unit Tests (Password Service)

```javascript
// server/services/__tests__/PasswordService.test.js
const { analyzePassword } = require('../PasswordService');

test('detects common password', () => {
  const result = analyzePassword('123456');
  expect(result.checks.not_common).toBe(false);
  expect(result.strength).toBe('Weak');
});

test('detects missing symbols', () => {
  const result = analyzePassword('MyPassword1');
  expect(result.checks.symbols).toBe(false);
  expect(result.suggestions).toContain(expect.stringContaining('symbol'));
});

test('strong password passes all checks', () => {
  const result = analyzePassword('xK9#mP2@wL5$nQ8!');
  expect(result.score).toBe(7);
  expect(result.strength).toBe('Very Strong');
});

test('entropy increases with length', () => {
  const short = analyzePassword('Abc1!');
  const long  = analyzePassword('Abc1!Abc1!Abc1!');
  expect(long.entropy_bits).toBeGreaterThan(short.entropy_bits);
});
```

---

## 4. Unit Tests (Scoring Engine)

```javascript
// server/services/__tests__/ScoringService.test.js
const { computeScoreFromAlerts } = require('../ScoringService');

test('no alerts = 100 score', () => {
  expect(computeScoreFromAlerts([])).toBe(100);
});

test('critical brute force deducts 25', () => {
  const alerts = [{ type: 'brute_force', severity: 'CRITICAL', acknowledged: false }];
  expect(computeScoreFromAlerts(alerts)).toBe(75);
});

test('acknowledged alerts not counted', () => {
  const alerts = [{ type: 'brute_force', severity: 'CRITICAL', acknowledged: true }];
  expect(computeScoreFromAlerts(alerts)).toBe(100);
});

test('score never goes below 0', () => {
  const alerts = Array(20).fill({ type: 'brute_force', severity: 'CRITICAL', acknowledged: false });
  expect(computeScoreFromAlerts(alerts)).toBe(0);
});
```

---

## 5. Demo Test Script (Run Before Presentation)

```bash
# 1. Start app
npm start

# 2. Verify health
curl http://localhost:3001/api/health

# 3. Create test file + add to watchlist
echo "original" > /tmp/demo-test.txt
# Add /tmp/demo-test.txt via UI

# 4. Trigger file change
echo "MODIFIED" >> /tmp/demo-test.txt
# → Verify alert appears on dashboard

# 5. Trigger brute force simulation
# → Add test lines to a temp log file OR show existing events in Supabase

# 6. Check password
# → Type "password123" → should show Weak
# → Type "xK9#mP2@wL5!" → should show Very Strong

# 7. Verify network devices appear on /network page

# 8. Verify health score is not 100% (with active alerts)
```

---

## 6. Known Limitations for Demo

| Limitation | Workaround |
|---|---|
| `/var/log/auth.log` may be empty on new machine | Pre-populate with test log lines |
| Network scan takes 30s with ping sweep | Use ARP-only mode (default) for demo |
| Windows log path differs | Demo on Linux VM or WSL |
| Supabase free tier cold start | Open Supabase dashboard to wake it up 5 min before demo |
