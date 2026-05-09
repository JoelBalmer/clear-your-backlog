import { IonIcon } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import { STATUS_LABELS, STATUS_COLORS } from './StatusBadge';
import type { GameStatus } from '../types/models';

const ALL: GameStatus[] = ['wishlist', 'backlog', 'playing', 'played', 'dropped'];

type Props = {
  value: GameStatus;
  onChange: (s: GameStatus) => void;
};

const StatusChips: React.FC<Props> = ({ value, onChange }) => (
  <div className="status-chips">
    {ALL.map((s) => {
      const selected = s === value;
      const color = STATUS_COLORS[s];
      return (
        <button
          key={s}
          type="button"
          className={`status-chip${selected ? ' status-chip--on' : ''}`}
          style={{
            background: selected ? `${color}28` : `${color}12`,
            color,
            borderColor: selected ? color : `${color}50`,
          }}
          onClick={() => onChange(s)}
        >
          <span className="status-chip__dot" style={{ background: color }} />
          <span className="status-chip__label">{STATUS_LABELS[s]}</span>
          {selected && (
            <IonIcon icon={checkmarkOutline} className="status-chip__check" />
          )}
        </button>
      );
    })}
  </div>
);

export default StatusChips;
