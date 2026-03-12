import { Check, X } from 'lucide-react';

const strengthColors = {
  'Weak': '#ef4444',
  'Fair': '#f97316',
  'Good': '#eab308',
  'Strong': '#84cc16',
  'Very Strong': '#22c55e',
};

const checkLabels = {
  length: 'At least 12 characters',
  uppercase: 'Contains uppercase letters',
  lowercase: 'Contains lowercase letters',
  numbers: 'Contains numbers',
  symbols: 'Contains special symbols (!@#$)',
  not_common: 'Not a common password',
  no_dict_word: 'No dictionary words detected',
};

export default function StrengthMeter({ result }) {
  if (!result) return null;

  const { score = 0, strength = 'Weak', entropy_bits = 0, checks = {}, suggestions = [] } = result;
  const color = strengthColors[strength] || '#ef4444';
  const percentage = (score / 7) * 100;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Strength bar */}
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider">Strength</span>
          <span className="text-sm font-bold" style={{ color }}>
            {strength} ({score}/7)
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-[var(--color-bg-primary)] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percentage}%`,
              background: `linear-gradient(90deg, ${color}cc, ${color})`,
              boxShadow: `0 0 12px ${color}40`,
            }}
          />
        </div>
        {entropy_bits > 0 && (
          <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
            Entropy: {entropy_bits.toFixed(1)} bits
          </p>
        )}
      </div>

      {/* Checks */}
      <div className="glass-card p-5">
        <h4 className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Security Checks</h4>
        <div className="space-y-2">
          {Object.entries(checks).map(([key, passed]) => (
            <div key={key} className="flex items-center gap-3">
              {passed ? (
                <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <Check size={12} className="text-emerald-400" />
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full bg-red-500/15 flex items-center justify-center">
                  <X size={12} className="text-red-400" />
                </div>
              )}
              <span className={`text-sm ${passed ? 'text-[var(--color-text-secondary)]' : 'text-[var(--color-text-primary)]'}`}>
                {checkLabels[key] || key}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="glass-card p-5">
          <h4 className="text-xs text-[var(--color-text-muted)] uppercase tracking-wider mb-3">Improvements</h4>
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-[var(--color-severity-medium)]">
                <span className="mt-0.5">💡</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
