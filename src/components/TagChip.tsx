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
  const bg = selected ? `${accent}33` : `${accent}1a`;
  const fg = selected ? accent : 'var(--ion-text-color, #111)';
  const border = selected ? accent : 'transparent';

  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        background: bg,
        color: fg,
        border: `1px solid ${border}`,
        cursor: onClick || onRemove ? 'pointer' : 'default',
        userSelect: 'none',
        whiteSpace: 'nowrap',
      }}
    >
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
