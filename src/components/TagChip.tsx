import { IonIcon } from '@ionic/react';
import { closeOutline } from 'ionicons/icons';

type Props = {
  name: string;
  color?: string | null;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
};

const TagChip: React.FC<Props> = ({ name, color, selected = false, onClick, onRemove }) => {
  const accent = color ?? '#6366f1';

  return (
    <span
      className={`tag-chip${selected ? ' tag-chip--on' : ''}${onClick ? ' tag-chip--interactive' : ''}`}
      style={{
        background: selected ? `${accent}28` : `${accent}14`,
        color: accent,
        borderColor: selected ? accent : `${accent}55`,
        borderStyle: selected ? 'solid' : 'dashed',
      }}
      onClick={onClick}
    >
      <span className="tag-chip__hash">#</span>
      {name}
      {onRemove && (
        <IonIcon
          icon={closeOutline}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{ fontSize: 14, marginRight: -4 }}
        />
      )}
    </span>
  );
};

export default TagChip;
