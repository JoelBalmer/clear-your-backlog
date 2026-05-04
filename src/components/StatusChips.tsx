import StatusBadge from './StatusBadge';
import type { GameStatus } from '../types/models';

const ALL: GameStatus[] = ['wishlist', 'backlog', 'playing', 'played', 'dropped'];

type Props = {
  value: GameStatus;
  onChange: (s: GameStatus) => void;
};

// Replaces IonSegment for picking a single status. Chips wrap and never
// truncate to "..." like segments do on narrow widths.
const StatusChips: React.FC<Props> = ({ value, onChange }) => (
  <div
    style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8,
    }}
  >
    {ALL.map((s) => {
      const selected = s === value;
      return (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          style={{
            background: 'none',
            padding: 0,
            border: '1.5px solid transparent',
            borderRadius: 999,
            cursor: 'pointer',
            transform: selected ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.1s ease, opacity 0.15s ease',
            opacity: selected ? 1 : 0.55,
            outline: 'none',
          }}
        >
          <StatusBadge status={s} size="md" />
        </button>
      );
    })}
  </div>
);

export default StatusChips;
