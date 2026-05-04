import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonRadio,
  IonRadioGroup,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline } from 'ionicons/icons';
import StatusBadge from './StatusBadge';
import TagChip from './TagChip';
import type { GameStatus, Tag } from '../types/models';

export type SortValue = 'recent' | 'rating' | 'name';

const ALL_STATUSES: GameStatus[] = ['wishlist', 'backlog', 'playing', 'played', 'dropped'];

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
  statuses: GameStatus[];
  onStatusesChange: (s: GameStatus[]) => void;
  tags: Tag[];
  activeTagIds: string[];
  onTagsChange: (ids: string[]) => void;
  sort: SortValue;
  onSortChange: (s: SortValue) => void;
  onClear: () => void;
};

const LibraryFilterSheet: React.FC<Props> = ({
  isOpen,
  onDismiss,
  statuses,
  onStatusesChange,
  tags,
  activeTagIds,
  onTagsChange,
  sort,
  onSortChange,
  onClear,
}) => {
  const toggleStatus = (s: GameStatus) => {
    onStatusesChange(statuses.includes(s) ? statuses.filter((x) => x !== s) : [...statuses, s]);
  };
  const toggleTag = (id: string) => {
    onTagsChange(activeTagIds.includes(id) ? activeTagIds.filter((x) => x !== id) : [...activeTagIds, id]);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onDismiss} initialBreakpoint={0.7} breakpoints={[0, 0.5, 0.7, 1]}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Filter & sort</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onDismiss}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="filter-sheet">
          <section className="filter-sheet__section">
            <h4 className="filter-sheet__heading">Status</h4>
            <div className="filter-sheet__chips">
              {ALL_STATUSES.map((s) => {
                const selected = statuses.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStatus(s)}
                    className={`filter-sheet__status${selected ? ' filter-sheet__status--selected' : ''}`}
                  >
                    <StatusBadge status={s} size="sm" />
                  </button>
                );
              })}
            </div>
          </section>

          {tags.length > 0 && (
            <section className="filter-sheet__section">
              <h4 className="filter-sheet__heading">Tags</h4>
              <div className="filter-sheet__chips">
                {tags.map((t) => (
                  <TagChip
                    key={t.id}
                    name={t.name}
                    color={t.color}
                    selected={activeTagIds.includes(t.id)}
                    onClick={() => toggleTag(t.id)}
                  />
                ))}
              </div>
            </section>
          )}

          <section className="filter-sheet__section">
            <h4 className="filter-sheet__heading">Sort by</h4>
            <IonRadioGroup
              value={sort}
              onIonChange={(e) => onSortChange((e.detail.value as SortValue) ?? 'recent')}
            >
              <IonItem lines="none">
                <IonLabel>Recently updated</IonLabel>
                <IonRadio slot="end" value="recent" />
              </IonItem>
              <IonItem lines="none">
                <IonLabel>Highest rated</IonLabel>
                <IonRadio slot="end" value="rating" />
              </IonItem>
              <IonItem lines="none">
                <IonLabel>Name (A–Z)</IonLabel>
                <IonRadio slot="end" value="name" />
              </IonItem>
            </IonRadioGroup>
          </section>

          <div style={{ display: 'flex', gap: 12, padding: '0 16px 24px' }}>
            <IonButton fill="outline" expand="block" onClick={onClear} style={{ flex: 1 }}>
              Clear all
            </IonButton>
            <IonButton expand="block" onClick={onDismiss} style={{ flex: 2 }}>
              Show results
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default LibraryFilterSheet;
