import { IonIcon } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';

// Sky-blue palette used for all interactive platform chips
const PC = '#0ea5e9';

type Props = {
  name: string;
  selected?: boolean;
  onClick?: () => void;
};

const PlatformBadge: React.FC<Props> = ({ name, selected = false, onClick }) => {
  if (onClick) {
    return (
      <button
        type="button"
        className={`prop-chip${selected ? ' prop-chip--on' : ''}`}
        style={{
          '--chip-fg': PC,
          '--chip-bg': `${PC}15`,
          '--chip-border': `${PC}50`,
          '--chip-bg-on': `${PC}2a`,
        } as React.CSSProperties}
        onClick={onClick}
      >
        {selected && <IonIcon icon={checkmarkOutline} className="prop-chip__check" />}
        {name}
      </button>
    );
  }

  // Display-only: neutral grey tag used in library cards
  return <span className="platform-badge">{name}</span>;
};

export default PlatformBadge;
