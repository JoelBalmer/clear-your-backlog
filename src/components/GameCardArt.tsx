import { IonIcon } from '@ionic/react';
import { gameControllerOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import StatusBadge from './StatusBadge';
import type { UserGameWithGame } from '../types/models';

type Props = {
  item: UserGameWithGame;
  routerLink?: string;
  onClick?: () => void;
};

const GameCardArt: React.FC<Props> = ({ item, routerLink, onClick }) => {
  const { userGame, game } = item;
  const history = useHistory();

  const handleClick = () => {
    if (onClick) { onClick(); }
    else if (routerLink) history.push(routerLink);
  };

  return (
    <button type="button" className="art-card" onClick={handleClick}>
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
    </button>
  );
};

export default GameCardArt;
