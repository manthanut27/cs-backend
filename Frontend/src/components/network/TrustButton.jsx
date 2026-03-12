import { ShieldCheck, ShieldAlert } from 'lucide-react';
import api from '../../api/client';

export default function TrustButton({ macAddress, isTrusted, onUpdate }) {
  const handleTrust = async () => {
    try {
      await api.patch('/network/trust', { mac_address: macAddress });
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to trust device:', err);
    }
  };

  if (isTrusted) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
        <ShieldCheck size={10} /> Trusted
      </span>
    );
  }

  return (
    <button
      onClick={handleTrust}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-[var(--color-accent)]/10 text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 transition-colors border border-[var(--color-accent)]/20"
    >
      <ShieldAlert size={10} /> Trust
    </button>
  );
}
