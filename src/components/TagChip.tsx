import { IonIcon } from '@ionic/react';
import { closeOutline, checkmarkOutline } from 'ionicons/icons';

type Props = {
  name: string;
  color?: string | null;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
};

const TagChip: React.FC<Props> = ({ name, color, selected = false, onClick, onRemove }) => {
  const c = color ?? '#6366f1';
  return (
    <span
      className={`prop-chip${selected ? ' prop-chip--on' : ''}${onClick ? ' prop-chip--clickable' : ''}`}
      style={{
        '--chip-fg': c,
        '--chip-bg': `${c}15`,
        '--chip-border': `${c}50`,
        '--chip-bg-on': `${c}2a`,
      } as React.CSSProperties}
      onClick={onClick}
    >
      {selected && <IonIcon icon={checkmarkOutline} className="prop-chip__check" />}
      <span className="prop-chip__hash">#</span>
      {name}
      {onRemove && (
        <IonIcon
          icon={closeOutline}
          className="prop-chip__remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        />
      )}
    </span>
  );
};

export default TagChip;
