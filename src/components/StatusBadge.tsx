import type { GameStatus } from '../types/models';

const LABELS: Record<GameStatus, string> = {
  backlog: 'Backlog',
  playing: 'Playing',
  played: 'Played',
  dropped: 'Dropped',
};

const COLORS: Record<GameStatus, string> = {
  backlog: '#6b7280',
  playing: '#10b981',
  played: '#6366f1',
  dropped: '#ef4444',
};

const StatusBadge: React.FC<{ status: GameStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => (
  <span
    style={{
      display: 'inline-block',
      padding: size === 'sm' ? '2px 8px' : '4px 10px',
      borderRadius: 999,
      fontSize: size === 'sm' ? 11 : 12,
      fontWeight: 600,
      letterSpacing: 0.2,
      background: `${COLORS[status]}22`,
      color: COLORS[status],
      whiteSpace: 'nowrap',
    }}
  >
    {LABELS[status]}
  </span>
);

export default StatusBadge;
