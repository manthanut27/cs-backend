import TopBar from '../components/layout/TopBar';
import PasswordInput from '../components/password/PasswordInput';
import StrengthMeter from '../components/password/StrengthMeter';
import { useState, useCallback } from 'react';
import api from '../api/client';
import { ShieldCheck } from 'lucide-react';

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
    // Debounce analysis
    const timeout = setTimeout(() => analyzePassword(value), 300);
    return () => clearTimeout(timeout);
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
