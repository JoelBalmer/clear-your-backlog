import { IonIcon } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';

type Props = {
  name: string;
  selected?: boolean;
  onClick?: () => void;
};

const PlatformBadge: React.FC<Props> = ({ name, selected = false, onClick }) => {
  const Tag = onClick ? 'button' : 'span';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`platform-badge${selected ? ' platform-badge--selected' : ''}${onClick ? ' platform-badge--interactive' : ''}`}
      onClick={onClick}
    >
      {onClick && selected && (
        <IonIcon icon={checkmarkOutline} className="platform-badge__check" />
      )}
      {name}
    </Tag>
  );
};

export default PlatformBadge;
