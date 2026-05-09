import { IonIcon } from '@ionic/react';
import { checkmarkOutline, gameControllerOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import { useLongPress } from '../lib/useLongPress';
import type { UserGameWithGame } from '../types/models';

type Props = {
  item: UserGameWithGame;
  routerLink?: string;
  onClick?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
};

const GameCardArt: React.FC<Props> = ({
  item,
  routerLink,
  onClick,
  selectionMode = false,
  selected = false,
  onSelect,
  onLongPress,
}) => {
  const { userGame, game } = item;
  const history = useHistory();

  const longPress = useLongPress(onLongPress ?? (() => {}), !selectionMode);

  const handleClick = () => {
    if (selectionMode) {
      onSelect?.();
    } else if (onClick) {
      onClick();
    } else if (routerLink) {
      history.push(routerLink);
    }
  };

  return (
    <button
      type="button"
      className={`art-card${selected ? ' art-card--selected' : ''}`}
      onClick={handleClick}
      {...longPress}
    >
      {game.coverUrl ? (
        <img src={game.coverUrl} alt={game.name} loading="lazy" className="art-card__img" />
      ) : (
        <div className="art-card__fallback">
          <IonIcon icon={gameControllerOutline} />
        </div>
      )}
      <div className="art-card__overlay">
        <StatusBadge status={userGame.status} size="sm" />
        <p className="art-card__title">{game.name}</p>
        {game.releaseYear && <p className="art-card__year">{game.releaseYear}</p>}
      </div>
      {selectionMode && (
        <span className={`art-card__select select-circle${selected ? ' select-circle--on' : ''}`}>
          {selected && <IonIcon icon={checkmarkOutline} />}
        </span>
      )}
    </button>
  );
};

export default GameCardArt;
