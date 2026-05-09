import type { GameStatus } from '../types/models';

export const STATUS_LABELS: Record<GameStatus, string> = {
  backlog: 'Backlog',
  playing: 'Playing',
  played: 'Played',
  dropped: 'Dropped',
  wishlist: 'Wishlist',
};

export const STATUS_COLORS: Record<GameStatus, string> = {
  backlog: '#6b7280',
  playing: '#10b981',
  played: '#6366f1',
  dropped: '#ef4444',
  wishlist: '#f59e0b',
};

const StatusBadge: React.FC<{ status: GameStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  const color = STATUS_COLORS[status];
  return (
    <span
      className={`status-badge status-badge--${size}`}
      style={{
        background: `${color}1e`,
        color,
      }}
    >
      <span className="status-badge__dot" style={{ background: color }} />
      {STATUS_LABELS[status]}
    </span>
  );
};

export default StatusBadge;
