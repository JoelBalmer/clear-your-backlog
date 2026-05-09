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
  <div className="prop-chip-row">
    {ALL.map((s) => {
      const selected = s === value;
      const c = STATUS_COLORS[s];
      return (
        <button
          key={s}
          type="button"
          className={`prop-chip${selected ? ' prop-chip--on' : ''}`}
          style={{
            '--chip-fg': c,
            '--chip-bg': `${c}15`,
            '--chip-border': `${c}50`,
            '--chip-bg-on': `${c}2a`,
          } as React.CSSProperties}
          onClick={() => onChange(s)}
        >
          <span className="prop-chip__dot" />
          {STATUS_LABELS[s]}
          {selected && <IonIcon icon={checkmarkOutline} className="prop-chip__check" />}
        </button>
      );
    })}
  </div>
);

export default StatusChips;
