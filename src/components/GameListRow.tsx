import { IonItem } from '@ionic/react';
import PlatformBadge from './PlatformBadge';
import type { Tag, UserGameWithGame } from '../types/models';

type Props = {
  item: UserGameWithGame;
  allTags?: Tag[];
  routerLink?: string;
};

const GameListRow: React.FC<Props> = ({ item, allTags = [], routerLink }) => {
  const { game } = item;
  const platforms = (game.platforms ?? []).slice(0, 2);
  const tags = allTags.filter((t) => (item.tagIds ?? []).includes(t.id)).slice(0, 2);

  return (
    <IonItem button detail={false} routerLink={routerLink} className="game-list-row">
      <span className="game-list-row__name">{game.name}</span>
      <div slot="end" className="game-list-row__meta">
        {platforms.map((p) => (
          <PlatformBadge key={p} name={p} />
        ))}
        {tags.map((t) => (
          <span
            key={t.id}
            className="game-list-row__tag"
            style={t.color ? { background: t.color + '33', color: t.color } : undefined}
          >
            {t.name}
          </span>
        ))}
      </div>
    </IonItem>
  );
};

export default GameListRow;
