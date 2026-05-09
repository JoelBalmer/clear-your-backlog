import { useCallback, useEffect, useState } from 'react';
import {
  IonAlert,
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
  useIonViewWillEnter,
} from '@ionic/react';
import {
  add,
  checkmarkOutline,
  gridOutline,
  libraryOutline,
  listOutline,
  optionsOutline,
  reorderFourOutline,
  trashOutline,
} from 'ionicons/icons';
import { ApiError, useApi } from '../lib/api';
import { bump as hapticBump, success as hapticSuccess, tap as hapticTap } from '../lib/haptics';
import GameCard from '../components/GameCard';
import GameCardArt from '../components/GameCardArt';
import GameListRow from '../components/GameListRow';
import AddGameModal from '../components/AddGameModal';
import LibraryGameModal from '../components/LibraryGameModal';
import LibraryFilterSheet, { type SortValue } from '../components/LibraryFilterSheet';
import GameCardSkeleton from '../components/Skeleton/GameCardSkeleton';
import ThemeButton from '../components/ThemeButton';
import type { GameStatus, Tag, UserGameWithGame } from '../types/models';

type ListResp = { items: UserGameWithGame[] };
type TagsResp = { items: Tag[] };
type ViewMode = 'cards' | 'detail' | 'list';

const STORAGE_KEY = 'library-view';

function readViewMode(): ViewMode {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'list') return 'detail';
  if (stored === 'text') return 'list';
  if (stored === 'cards' || stored === 'detail') return stored;
  return 'detail';
}

const Library: React.FC = () => {
  const api = useApi();
  const [statuses, setStatuses] = useState<GameStatus[]>([]);
  const [sort, setSort] = useState<SortValue>('recent');
  const [items, setItems] = useState<UserGameWithGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [selectedItem, setSelectedItem] = useState<UserGameWithGame | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [activeTagIds, setActiveTagIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>(readViewMode);

  // Multi-select state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBatchDelete, setConfirmBatchDelete] = useState(false);

  const cycleView = () => {
    setViewMode((prev) => {
      const next: ViewMode = prev === 'cards' ? 'detail' : prev === 'detail' ? 'list' : 'cards';
      localStorage.setItem(STORAGE_KEY, next);
      return next;
    });
  };

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

  useIonViewWillEnter(() => {
    load();
  });

  const enterSelection = (id: string) => {
    hapticBump();
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id: string) => {
    hapticTap();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (!items) return;
    const allIds = new Set(items.map((i) => i.userGame.id));
    if (selectedIds.size === allIds.size) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(allIds);
    }
  };

  const batchDelete = async () => {
    const ids = Array.from(selectedIds);
    try {
      await Promise.all(ids.map((id) => api(`/api/user-games/${id}`, { method: 'DELETE' })));
      hapticSuccess();
    } catch (err) {
      console.error('[library] batch delete error:', err);
    }
    exitSelection();
    load();
  };

  const activeFilterCount = statuses.length + activeTagIds.length;
  const allSelected = items != null && selectedIds.size === items.length && items.length > 0;

  return (
    <IonPage>
      <IonHeader>
        {selectionMode ? (
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={exitSelection}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>{selectedIds.size} selected</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={selectAll} aria-label={allSelected ? 'Deselect all' : 'Select all'}>
                <IonIcon icon={checkmarkOutline} />
              </IonButton>
              <IonButton
                color="danger"
                disabled={selectedIds.size === 0}
                onClick={() => setConfirmBatchDelete(true)}
                aria-label="Delete selected"
              >
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        ) : (
          <>
            <IonToolbar>
              <IonTitle>Library</IonTitle>
              <IonButtons slot="end">
                <IonButton fill="clear" onClick={cycleView} aria-label="Cycle view mode">
                  <IonIcon
                    icon={
                      viewMode === 'cards'
                        ? gridOutline
                        : viewMode === 'detail'
                          ? listOutline
                          : reorderFourOutline
                    }
                  />
                </IonButton>
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
          </>
        )}
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher
          slot="fixed"
          disabled={selectionMode}
          onIonRefresh={(e) => load().finally(() => e.detail.complete())}
        >
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

        {items && items.length > 0 && viewMode === 'detail' && (
          <IonList lines="full">
            {items.map((item) => (
              <GameCard
                key={item.userGame.id}
                item={item}
                onClick={() => setSelectedItem(item)}
                selectionMode={selectionMode}
                selected={selectedIds.has(item.userGame.id)}
                onSelect={() => toggleSelect(item.userGame.id)}
                onLongPress={() => enterSelection(item.userGame.id)}
              />
            ))}
          </IonList>
        )}

        {items && items.length > 0 && viewMode === 'cards' && (
          <div className="game-grid">
            {items.map((item) => (
              <GameCardArt
                key={item.userGame.id}
                item={item}
                onClick={() => setSelectedItem(item)}
                selectionMode={selectionMode}
                selected={selectedIds.has(item.userGame.id)}
                onSelect={() => toggleSelect(item.userGame.id)}
                onLongPress={() => enterSelection(item.userGame.id)}
              />
            ))}
          </div>
        )}

        {items && items.length > 0 && viewMode === 'list' && (
          <IonList lines="full">
            {items.map((item) => (
              <GameListRow
                key={item.userGame.id}
                item={item}
                allTags={allTags}
                onClick={() => setSelectedItem(item)}
                selectionMode={selectionMode}
                selected={selectedIds.has(item.userGame.id)}
                onSelect={() => toggleSelect(item.userGame.id)}
                onLongPress={() => enterSelection(item.userGame.id)}
              />
            ))}
          </IonList>
        )}

        {!selectionMode && (
          <IonFab slot="fixed" vertical="bottom" horizontal="end">
            <IonFabButton onClick={() => setShowAdd(true)}>
              <IonIcon icon={add} />
            </IonFabButton>
          </IonFab>
        )}

        <LibraryGameModal
          isOpen={!!selectedItem}
          item={selectedItem}
          onDismiss={(changed) => {
            setSelectedItem(null);
            if (changed) load();
          }}
        />

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

        <IonAlert
          isOpen={confirmBatchDelete}
          onDidDismiss={() => setConfirmBatchDelete(false)}
          header={`Remove ${selectedIds.size} game${selectedIds.size === 1 ? '' : 's'}?`}
          message="This permanently removes your ratings, notes, and tags for these games."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Remove', role: 'destructive', handler: batchDelete },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Library;
