import { useRef } from 'react';
import { IonIcon, IonItem } from '@ionic/react';
import { checkmarkOutline } from 'ionicons/icons';
import PlatformBadge from './PlatformBadge';
import { useLongPress } from '../lib/useLongPress';
import type { Tag, UserGameWithGame } from '../types/models';

type Props = {
  item: UserGameWithGame;
  allTags?: Tag[];
  routerLink?: string;
  onClick?: () => void;
  selectionMode?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onLongPress?: () => void;
};

const GameListRow: React.FC<Props> = ({
  item,
  allTags = [],
  routerLink,
  onClick,
  selectionMode = false,
  selected = false,
  onSelect,
  onLongPress,
}) => {
  const { game } = item;
  const platforms = (game.platforms ?? []).slice(0, 2);
  const tags = allTags.filter((t) => (item.tagIds ?? []).includes(t.id)).slice(0, 2);

  const rowRef = useRef<HTMLElement>(null);
  useLongPress(rowRef, onLongPress ?? (() => {}), !selectionMode);

  const handleClick = selectionMode ? onSelect : onClick;

  return (
    <IonItem
      ref={rowRef as any}
      button
      detail={false}
      routerLink={selectionMode ? undefined : routerLink}
      onClick={handleClick}
      className={`game-list-row${selected ? ' game-list-row--selected' : ''}`}
    >
      {selectionMode && (
        <div slot="start" className="game-list-row__select">
          <span className={`select-circle${selected ? ' select-circle--on' : ''}`}>
            {selected && <IonIcon icon={checkmarkOutline} />}
          </span>
        </div>
      )}
      <span className="game-list-row__name">{game.name}</span>
      <div slot="end" className="game-list-row__meta">
        {platforms.map((p) => (
          <PlatformBadge key={p} name={p} />
        ))}
        {tags.map((t) => (
          <span
            key={t.id}
            className="game-list-row__tag"
            style={t.color ? { background: t.color + '22', color: t.color, borderColor: t.color + '55' } : undefined}
          >
            #{t.name}
          </span>
        ))}
      </div>
    </IonItem>
  );
};

export default GameListRow;
