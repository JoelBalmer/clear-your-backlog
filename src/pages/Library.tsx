import { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { add, libraryOutline } from 'ionicons/icons';
import { ApiError, useApi } from '../lib/api';
import GameCard from '../components/GameCard';
import AddGameModal from '../components/AddGameModal';
import type { GameStatus, UserGameWithGame } from '../types/models';

type SegValue = 'all' | GameStatus;
type SortValue = 'recent' | 'rating' | 'name';

type ListResp = { items: UserGameWithGame[] };

const SEGMENTS: { value: SegValue; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'playing', label: 'Playing' },
  { value: 'played', label: 'Played' },
  { value: 'dropped', label: 'Dropped' },
];

const Library: React.FC = () => {
  const api = useApi();
  const [seg, setSeg] = useState<SegValue>('all');
  const [sort, setSort] = useState<SortValue>('recent');
  const [items, setItems] = useState<UserGameWithGame[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const params = new URLSearchParams({ sort });
      if (seg !== 'all') params.set('status', seg);
      const r = await api<ListResp>(`/api/user-games?${params}`);
      setItems(r.items);
    } catch (err) {
      if (err instanceof ApiError) setError(`Failed to load (HTTP ${err.status})`);
      else setError('Network error');
      setItems([]);
    }
  }, [api, seg, sort]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Library</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment
            value={seg}
            onIonChange={(e) => setSeg((e.detail.value as SegValue) ?? 'all')}
            scrollable
          >
            {SEGMENTS.map((s) => (
              <IonSegmentButton key={s.value} value={s.value}>
                <IonLabel>{s.label}</IonLabel>
              </IonSegmentButton>
            ))}
          </IonSegment>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => load().finally(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        <IonItem lines="none">
          <IonLabel style={{ fontSize: 13, color: 'var(--ion-color-medium)' }}>Sort</IonLabel>
          <IonSelect
            value={sort}
            interface="popover"
            onIonChange={(e) => setSort((e.detail.value as SortValue) ?? 'recent')}
          >
            <IonSelectOption value="recent">Recently updated</IonSelectOption>
            <IonSelectOption value="rating">Highest rated</IonSelectOption>
            <IonSelectOption value="name">Name (A–Z)</IonSelectOption>
          </IonSelect>
        </IonItem>

        {error && (
          <IonText color="danger">
            <p style={{ padding: '0 16px' }}>{error}</p>
          </IonText>
        )}

        {items === null && !error && (
          <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {items && items.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-state__icon">
              <IonIcon icon={libraryOutline} />
            </div>
            <h2>{seg === 'all' ? 'Your library is empty' : `Nothing in ${seg}`}</h2>
            <IonNote color="medium">
              <p>Tap the + button to search the IGDB catalog and add a game.</p>
            </IonNote>
            <IonButton onClick={() => setShowAdd(true)} style={{ marginTop: 16 }}>
              Add a game
            </IonButton>
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
      </IonContent>
    </IonPage>
  );
};

export default Library;
