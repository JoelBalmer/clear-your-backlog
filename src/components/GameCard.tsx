import { IonIcon, IonItem, IonLabel } from '@ionic/react';
import { gameControllerOutline } from 'ionicons/icons';
import StarRating from './StarRating';
import StatusBadge from './StatusBadge';
import PlatformBadge from './PlatformBadge';
import type { UserGameWithGame } from '../types/models';

type Props = {
  item: UserGameWithGame;
  onClick?: () => void;
  routerLink?: string;
};

const GameCard: React.FC<Props> = ({ item, onClick, routerLink }) => {
  const { userGame, game } = item;
  const rating = userGame.rating != null ? Number(userGame.rating) : null;
  const platforms = (game.platforms ?? []).slice(0, 2);

  return (
    <IonItem button detail={false} onClick={onClick} routerLink={routerLink} className="game-card">
      <div slot="start" className="game-card__cover">
        {game.coverUrl ? (
          <img src={game.coverUrl} alt={game.name} loading="lazy" />
        ) : (
          <div className="game-card__cover-fallback">
            <IonIcon icon={gameControllerOutline} />
          </div>
        )}
      </div>
      <IonLabel>
        <h2 className="game-card__title">{game.name}</h2>
        <p className="game-card__meta">
          {game.releaseYear ? `${game.releaseYear}` : ''}
        </p>
        {platforms.length > 0 && (
          <div className="game-card__platforms">
            {platforms.map((p) => (
              <PlatformBadge key={p} name={p} />
            ))}
          </div>
        )}
        <div className="game-card__row">
          <StatusBadge status={userGame.status} size="sm" />
          {rating !== null && <StarRating value={rating} size={14} />}
        </div>
      </IonLabel>
    </IonItem>
  );
};

export default GameCard;
