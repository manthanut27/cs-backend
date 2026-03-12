import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title = 'No data', description = '' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] flex items-center justify-center mb-4">
        <Icon size={28} className="text-[var(--color-text-muted)]" />
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-[var(--color-text-muted)] max-w-[280px]">{description}</p>
      )}
    </div>
  );
}
