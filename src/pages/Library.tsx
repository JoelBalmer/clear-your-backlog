import { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { add, libraryOutline, optionsOutline } from 'ionicons/icons';
import { ApiError, useApi } from '../lib/api';
import GameCard from '../components/GameCard';
import AddGameModal from '../components/AddGameModal';
import LibraryFilterSheet, { type SortValue } from '../components/LibraryFilterSheet';
import GameCardSkeleton from '../components/Skeleton/GameCardSkeleton';
import ThemeButton from '../components/ThemeButton';
import type { GameStatus, Tag, UserGameWithGame } from '../types/models';

type ListResp = { items: UserGameWithGame[] };
type TagsResp = { items: Tag[] };

const Library: React.FC = () => {
  const api = useApi();
  const [statuses, setStatuses] = useState<GameStatus[]>([]);
  const [sort, setSort] = useState<SortValue>('recent');
  const [items, setItems] = useState<UserGameWithGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);

  const load = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({ sort });
      if (statuses.length > 0) params.set('status', statuses.join(','));
      if (activeTagIds.length > 0) params.set('tags', activeTagIds.join(','));
      const r = await api<ListResp>(`/api/user-games?${params}`);
      setItems(r.items);
    } catch (err) {
      if (err instanceof ApiError) setError(`Failed to load (HTTP ${err.status})`);
      else setError('Network error');
      setItems([]);
    }
  }, [api, statuses, sort, activeTagIds]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api<TagsResp>('/api/tags')
      .then((r) => setAllTags(r.items))
      .catch(() => setAllTags([]));
  }, [api]);

  const activeFilterCount = statuses.length + activeTagIds.length;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Library</IonTitle>
          <IonButtons slot="end">
            <ThemeButton />
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <div className="library-toolbar">
            <IonButton
              fill="outline"
              size="small"
              className="library-toolbar__filter"
              onClick={() => setShowFilter(true)}
            >
              <IonIcon icon={optionsOutline} slot="start" />
              Filter
              {activeFilterCount > 0 && (
                <span className="library-toolbar__count">{activeFilterCount}</span>
              )}
            </IonButton>
            <IonNote color="medium" style={{ fontSize: 12, marginLeft: 'auto' }}>
              {sort === 'recent' && 'Recently updated'}
              {sort === 'rating' && 'Highest rated'}
              {sort === 'name' && 'A–Z'}
            </IonNote>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => load().finally(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        {error && (
          <IonText color="danger">
            <p style={{ padding: '0 16px' }}>{error}</p>
          </IonText>
        )}

        {items === null && !error && (
          <IonList lines="full">
            {Array.from({ length: 4 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </IonList>
        )}

        {items && items.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-state__icon">
              <IonIcon icon={libraryOutline} />
            </div>
            <h2>{activeFilterCount === 0 ? 'Your library is empty' : 'No games match'}</h2>
            <IonNote color="medium">
              <p>
                {activeFilterCount === 0
                  ? 'Tap the + button to search the IGDB catalog and add a game.'
                  : 'Try clearing some filters or adding a new game.'}
              </p>
            </IonNote>
            {activeFilterCount === 0 ? (
              <IonButton onClick={() => setShowAdd(true)} style={{ marginTop: 16 }}>
                Add a game
              </IonButton>
            ) : (
              <IonButton
                fill="outline"
                onClick={() => {
                  setStatuses([]);
                  setActiveTagIds([]);
                }}
                style={{ marginTop: 16 }}
              >
                Clear filters
              </IonButton>
            )}
          </div>
        )}

        {items && items.length > 0 && (
          <IonList lines="full">
            {items.map((item) => (
              <GameCard
                key={item.userGame.id}
                item={item}
                routerLink={`/tabs/library/g/${item.userGame.igdbId}`}
              />
            ))}
          </IonList>
        )}

        <IonFab slot="fixed" vertical="bottom" horizontal="end">
          <IonFabButton onClick={() => setShowAdd(true)}>
            <IonIcon icon={add} />
          </IonFabButton>
        </IonFab>

        <AddGameModal
          isOpen={showAdd}
          onDismiss={(added) => {
            setShowAdd(false);
            if (added) load();
          }}
        />

        <LibraryFilterSheet
          isOpen={showFilter}
          onDismiss={() => setShowFilter(false)}
          statuses={statuses}
          onStatusesChange={setStatuses}
          tags={allTags}
          activeTagIds={activeTagIds}
          onTagsChange={setActiveTagIds}
          sort={sort}
          onSortChange={setSort}
          onClear={() => {
            setStatuses([]);
            setActiveTagIds([]);
            setSort('recent');
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default Library;
