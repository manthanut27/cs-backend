import { useState } from 'react';
import { AlertTriangle, Shield, Wand2 } from 'lucide-react';
import api from '../../api/client';

export default function RiskFlagList({ riskFlags = [] }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [aiText, setAiText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAssist = async (flag, index) => {
    setSelectedIndex(index);
    setLoading(true);
    setError('');
    setAiText('');
    try {
      const res = await api.post('/audit/assist', {
        level: flag.level,
        message: flag.message,
      });
      setAiText(res.aiExplanation || '');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (riskFlags.length === 0) {
    return (
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Risk Flags</h3>
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <Shield size={16} />
          <span>No risks detected</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-5 space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Risk Flags
          <span className="ml-2 text-red-400 font-normal">({riskFlags.length})</span>
        </h3>
        <p className="text-[10px] text-[var(--color-text-muted)] hidden sm:block">
          Use AI help on medium / high risks
        </p>
      </div>

      <div className="space-y-2">
        {riskFlags.map((flag, i) => {
          const isCritical = flag.level === 'HIGH' || flag.level === 'CRITICAL';
          const showAiButton = flag.level === 'MEDIUM' || flag.level === 'HIGH' || flag.level === 'CRITICAL';
          const isSelected = selectedIndex === i;

          return (
            <div
              key={i}
              className={`p-3 rounded-lg border ${
                isCritical ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className={`flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-400' : 'text-yellow-400'}`}
                />
                <div className="flex-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wide ${
                      isCritical ? 'text-red-400' : 'text-yellow-400'
                    }`}
                  >
                    {flag.level}
                  </span>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{flag.message}</p>

                  {showAiButton && (
                    <button
                      type="button"
                      onClick={() => handleAssist(flag, i)}
                      className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                    >
                      <Wand2 size={12} />
                      {loading && isSelected ? 'Analyzing…' : 'AI: explain & fix'}
                    </button>
                  )}
                </div>
              </div>

              {isSelected && (aiText || error) && (
                <div className="mt-3 rounded-md bg-[var(--color-bg-secondary)]/70 border border-[var(--color-border)] px-3 py-2 text-[11px] text-[var(--color-text-secondary)] whitespace-pre-wrap">
                  {error ? (
                    <span className="text-red-400">{error}</span>
                  ) : (
                    aiText
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
