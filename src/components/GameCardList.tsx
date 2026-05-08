import { IonItem, IonLabel, IonNote } from '@ionic/react';
import type { UserGameWithGame } from '../types/models';

type Props = {
  item: UserGameWithGame;
  routerLink?: string;
};

const GameCardList: React.FC<Props> = ({ item, routerLink }) => {
  const { game } = item;
  const platform = (game.platforms ?? [])[0] ?? null;

  return (
    <IonItem button detail={false} routerLink={routerLink} className="game-list-row">
      <IonLabel className="game-list-row__name">{game.name}</IonLabel>
      {platform && (
        <IonNote slot="end" className="game-list-row__platform">
          {platform}
        </IonNote>
      )}
    </IonItem>
  );
};

export default GameCardList;
