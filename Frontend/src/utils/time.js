import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

export function formatTimestamp(ts) {
  if (!ts) return '—';
  return dayjs(ts).format('MMM D, HH:mm:ss');
}

export function timeAgo(ts) {
  if (!ts) return '—';
  return dayjs(ts).fromNow();
}

export function formatDuration(seconds) {
  if (!seconds) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default dayjs;
