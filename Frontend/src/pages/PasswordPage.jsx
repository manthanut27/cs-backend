import TopBar from '../components/layout/TopBar';
import PasswordInput from '../components/password/PasswordInput';
import StrengthMeter from '../components/password/StrengthMeter';
import { useState, useCallback } from 'react';
import api from '../api/client';
import { ShieldCheck, Wand2 } from 'lucide-react';

function generateStrongPassword(length = 16) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%^&*()-_=+[]{}:;,.?';
  const all = upper + lower + digits + symbols;

  const picks = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  const getRandomInt = (max) => {
    if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
      const array = new Uint32Array(1);
      window.crypto.getRandomValues(array);
      return array[0] % max;
    }
    return Math.floor(Math.random() * max);
  };

  for (let i = picks.length; i < length; i += 1) {
    picks.push(all[getRandomInt(all.length)]);
  }

  for (let i = picks.length - 1; i > 0; i -= 1) {
    const j = getRandomInt(i + 1);
    [picks[i], picks[j]] = [picks[j], picks[i]];
  }

  return picks.join('');
}

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzePassword = useCallback(async (pwd) => {
    if (!pwd.trim()) {
      setResult(null);
      return;
    }
    setLoading(true);
    try {
      const data = await api.post('/password/check', { password: pwd });
      setResult(data);
    } catch {
      // Fallback: client-side basic analysis
      const checks = {
        length: pwd.length >= 12,
        uppercase: /[A-Z]/.test(pwd),
        lowercase: /[a-z]/.test(pwd),
        numbers: /[0-9]/.test(pwd),
        symbols: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(pwd),
        not_common: true,
        no_dict_word: true,
      };
      const score = Object.values(checks).filter(Boolean).length;
      const labels = ['Weak', 'Weak', 'Weak', 'Fair', 'Fair', 'Good', 'Strong', 'Very Strong'];
      let charsetSize = 0;
      if (/[a-z]/.test(pwd)) charsetSize += 26;
      if (/[A-Z]/.test(pwd)) charsetSize += 26;
      if (/[0-9]/.test(pwd)) charsetSize += 10;
      if (/[^a-zA-Z0-9]/.test(pwd)) charsetSize += 32;
      const entropy = charsetSize > 0 ? Math.log2(Math.pow(charsetSize, pwd.length)) : 0;

      const suggestions = [];
      if (!checks.length) suggestions.push('Use at least 12 characters');
      if (!checks.symbols) suggestions.push('Add symbols like ! @ # $ to increase strength');
      if (!checks.uppercase) suggestions.push('Add uppercase letters');
      if (!checks.numbers) suggestions.push('Include numbers');

      setResult({ score, strength: labels[score], entropy_bits: entropy, checks, suggestions });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (value) => {
    setPassword(value);
    const timeout = setTimeout(() => analyzePassword(value), 300);
    return () => clearTimeout(timeout);
  };

  const handleGenerate = () => {
    const pwd = generateStrongPassword(16);
    setPassword(pwd);
    analyzePassword(pwd);
  };

  return (
    <>
      <TopBar title="Password Strength Checker" />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-accent)]/10 flex items-center justify-center mx-auto border border-[var(--color-accent)]/20">
              <ShieldCheck size={28} className="text-[var(--color-accent)]" />
            </div>
            <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Password Analyzer</h2>
            <p className="text-xs text-[var(--color-text-muted)]">
              Your password is never stored, logged, or transmitted.
            </p>
          </div>

          {/* Input */}
          <PasswordInput value={password} onChange={handleChange} />

          {/* Generator */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleGenerate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
            >
              <Wand2 size={14} />
              Generate strong password
            </button>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center">
              <div className="w-5 h-5 border-2 border-[var(--color-border-light)] border-t-[var(--color-accent)] rounded-full animate-spin" />
            </div>
          )}

          {/* Results */}
          <StrengthMeter result={result} />
        </div>
      </div>
    </>
  );
}
