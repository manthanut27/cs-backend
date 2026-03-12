import { useEffect, useRef } from 'react';
import { getHealthLabel } from '../../utils/severity';

export default function HealthScore({ score = 100 }) {
  const circleRef = useRef(null);
  const health = getHealthLabel(score);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.style.transition = 'stroke-dashoffset 1.5s ease-in-out';
      circleRef.current.style.strokeDashoffset = offset;
    }
  }, [offset]);

  return (
    <div className="glass-card p-6 flex flex-col items-center justify-center">
      <h3 className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
        System Health
      </h3>

      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60" cy="60" r="54"
            stroke="var(--color-border)"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            ref={circleRef}
            cx="60" cy="60" r="54"
            stroke={health.color}
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference}
            style={{ filter: `drop-shadow(0 0 6px ${health.color}40)` }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold" style={{ color: health.color }}>
            {score}
          </span>
          <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
            percent
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: health.color }} />
        <span className="text-sm font-semibold" style={{ color: health.color }}>
          {health.label}
        </span>
      </div>
    </div>
  );
}
