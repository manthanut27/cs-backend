const zxcvbn = require('zxcvbn');
const logger = require('../utils/logger');

// Common passwords check (basic top-100 embedded, full list can be loaded from file)
const TOP_COMMON = [
  'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567',
  'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
  'ashley', 'michael', 'shadow', '123123', '654321', 'superman', 'qazwsx',
  'password1', 'password123', '1234', '12345', '123456789', '1234567890',
  'admin', 'welcome', 'login', 'starwars', 'passw0rd', 'hello', 'charlie',
  'donald', 'football', 'access', 'thunder', 'hottie', 'master', 'mustang',
];

const DICT_WORDS = [
  'password', 'dragon', 'master', 'monkey', 'shadow', 'sunshine', 'princess',
  'football', 'charlie', 'computer', 'internet', 'killer', 'pepper',
  'summer', 'starwars', 'guitar', 'hammer', 'silver',
];

function calculateEntropy(password) {
  let charsetSize = 0;
  if (/[a-z]/.test(password)) charsetSize += 26;
  if (/[A-Z]/.test(password)) charsetSize += 26;
  if (/[0-9]/.test(password)) charsetSize += 10;
  if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
  if (charsetSize === 0) return 0;
  return Math.log2(Math.pow(charsetSize, password.length));
}

function containsDictionaryWord(password) {
  const lower = password.toLowerCase();
  return DICT_WORDS.some(word => lower.includes(word));
}

function getStrengthLabel(score) {
  if (score <= 2) return 'Weak';
  if (score <= 4) return 'Fair';
  if (score === 5) return 'Good';
  if (score === 6) return 'Strong';
  return 'Very Strong';
}

/**
 * Analyze password strength — NEVER logs or stores the password
 */
function analyzePassword(password) {
  if (!password) {
    return { score: 0, strength: 'Weak', entropy_bits: 0, checks: {}, suggestions: ['Enter a password'] };
  }

  const checks = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password),
    not_common: !TOP_COMMON.includes(password.toLowerCase()),
    no_dict_word: !containsDictionaryWord(password),
  };

  const score = Object.values(checks).filter(Boolean).length;
  const entropy = calculateEntropy(password);
  const strength = getStrengthLabel(score);

  // zxcvbn analysis
  let zxcvbnResult = null;
  try {
    zxcvbnResult = zxcvbn(password);
  } catch {
    // zxcvbn may fail on edge cases
  }

  // Build suggestions
  const suggestions = [];
  if (!checks.length) suggestions.push('Use at least 12 characters for stronger security');
  if (!checks.uppercase) suggestions.push('Add uppercase letters (A-Z)');
  if (!checks.lowercase) suggestions.push('Add lowercase letters (a-z)');
  if (!checks.numbers) suggestions.push('Include numbers (0-9)');
  if (!checks.symbols) suggestions.push('Add symbols like ! @ # $ to increase strength');
  if (!checks.not_common) suggestions.push('This is a very common password — choose something unique');
  if (!checks.no_dict_word) suggestions.push('Avoid using dictionary words');

  // Add zxcvbn suggestions
  if (zxcvbnResult?.feedback?.suggestions) {
    for (const s of zxcvbnResult.feedback.suggestions) {
      if (!suggestions.includes(s)) suggestions.push(s);
    }
  }

  return {
    score,
    strength,
    entropy_bits: parseFloat(entropy.toFixed(1)),
    checks,
    suggestions,
    zxcvbn_score: zxcvbnResult?.score ?? null,
    crack_time: zxcvbnResult?.crack_times_display?.offline_slow_hashing_1e4_per_second ?? null,
  };
}

module.exports = { analyzePassword };
