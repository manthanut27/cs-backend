# 08 — Scoring Engine Specification
## Personal Cybersecurity Toolkit — Hawkathon 2026

---

## 1. Overview

The scoring engine computes two types of scores:

1. **System Health Score (0–100%)** — Overall security posture of the machine, shown on the dashboard
2. **Password Strength Score (0–7)** — Evaluates individual password quality

---

## 2. System Health Score

### 2.1 Formula

```
healthScore = 100 - sum(deductions for all active unacknowledged alerts)
              clamped to [0, 100]
```

### 2.2 Deduction Table

| Alert Type | Severity | Deduction |
|---|---|---|
| Brute force attack | CRITICAL | -25 |
| System file modified (/etc/*) | CRITICAL | -25 |
| Risky port open (Telnet/FTP/SMB) | HIGH | -15 |
| User file modified | HIGH | -10 |
| Sudo failure detected | HIGH | -10 |
| Unknown device on LAN | MEDIUM | -5 |
| Single failed login | LOW | -2 |
| Invalid username attempt | MEDIUM | -5 |

### 2.3 Score Labels

| Range | Label | Color |
|---|---|---|
| 90–100 | Secure | Green |
| 70–89 | Good | Light Green |
| 50–69 | At Risk | Yellow |
| 25–49 | Vulnerable | Orange |
| 0–24 | Critical | Red |

### 2.4 Implementation

```javascript
// server/services/ScoringService.js
const DEDUCTIONS = {
  brute_force:    { CRITICAL: 25 },
  file_change:    { CRITICAL: 25, HIGH: 10 },
  open_port:      { HIGH: 15 },
  unknown_device: { MEDIUM: 5 },
  failed_login:   { LOW: 2, MEDIUM: 5 },
  sudo_failed:    { HIGH: 10 },
};

async function computeHealthScore() {
  const { data: alerts } = await supabase
    .from('security_alerts')
    .select('type, severity')
    .eq('acknowledged', false);

  let score = 100;
  for (const alert of alerts) {
    const deduction = DEDUCTIONS[alert.type]?.[alert.severity] ?? 0;
    score -= deduction;
  }
  return Math.max(0, Math.min(100, score));
}
```

---

## 3. Password Strength Score

### 3.1 Check Criteria (7 checks, 1 point each)

| # | Check | Passes If |
|---|---|---|
| 1 | Minimum length | `password.length >= 12` |
| 2 | Has uppercase | `/[A-Z]/.test(password)` |
| 3 | Has lowercase | `/[a-z]/.test(password)` |
| 4 | Has numbers | `/[0-9]/.test(password)` |
| 5 | Has symbols | `/[!@#$%^&*]/.test(password)` |
| 6 | Not a common password | Not in top-10,000 list |
| 7 | No dictionary word | No word from 3000-word dictionary |

### 3.2 Strength Labels

| Score | Label | Color |
|---|---|---|
| 0–2 | Weak | Red |
| 3–4 | Fair | Orange |
| 5 | Good | Yellow |
| 6 | Strong | Light Green |
| 7 | Very Strong | Green |

### 3.3 Entropy Calculation

```javascript
function calculateEntropy(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
  return Math.log2(Math.pow(charsetSize, password.length));
}
```

**Entropy guidance:**
- < 28 bits → Very weak
- 28–35 bits → Weak
- 36–59 bits → Reasonable
- 60–127 bits → Strong
- 128+ bits → Very strong

### 3.4 zxcvbn Integration

`zxcvbn` (Dropbox library) provides additional scoring on top of the basic checks:

```javascript
const zxcvbn = require('zxcvbn');

function analyzePassword(password) {
  const zResult = zxcvbn(password);
  const basicChecks = runBasicChecks(password);
  const basicScore = Object.values(basicChecks).filter(Boolean).length;

  return {
    score: basicScore,
    zxcvbn_score: zResult.score,       // 0-4 from zxcvbn
    crack_time: zResult.crack_times_display.offline_slow_hashing_1e4_per_second,
    entropy_bits: calculateEntropy(password),
    checks: basicChecks,
    strength: getStrengthLabel(basicScore),
    suggestions: [
      ...zResult.feedback.suggestions,
      ...getBasicSuggestions(basicChecks)
    ]
  };
}
```

---

## 4. Module Status Indicators

Each module card on the dashboard shows a status derived from its unacknowledged alerts:

```javascript
function getModuleStatus(moduleName, alerts) {
  const moduleAlerts = alerts.filter(a =>
    a.source === moduleName && !a.acknowledged
  );
  if (moduleAlerts.some(a => a.severity === 'CRITICAL')) return 'critical';
  if (moduleAlerts.some(a => a.severity === 'HIGH'))     return 'warning';
  if (moduleAlerts.some(a => a.severity === 'MEDIUM'))   return 'caution';
  if (moduleAlerts.length > 0)                           return 'info';
  return 'safe';
}
```

| Status | Color | Icon |
|---|---|---|
| safe | Green | ✅ |
| info | Blue | ℹ️ |
| caution | Yellow | ⚠️ |
| warning | Orange | 🔶 |
| critical | Red | 🔴 |
