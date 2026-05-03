import { useCallback, useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { compassOutline, gameControllerOutline } from 'ionicons/icons';
import { ApiError, useApi } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import StarRating from '../components/StarRating';
import type { FeedItem } from '../types/models';

type FeedResp = { items: FeedItem[] };

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  return `${Math.floor(d / 365)}y`;
}

const Discover: React.FC = () => {
  const api = useApi();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const r = await api<FeedResp>('/api/feed');
      setItems(r.items);
    } catch (err) {
      if (err instanceof ApiError) setError(`Failed (HTTP ${err.status})`);
      else setError('Network error');
      setItems([]);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Discover</IonTitle>
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
          <div style={{ display: 'grid', placeItems: 'center', padding: 48 }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {items && items.length === 0 && !error && (
          <div className="empty-state">
            <div className="empty-state__icon">
              <IonIcon icon={compassOutline} />
            </div>
            <h2>Your feed is empty</h2>
            <IonNote color="medium">
              <p>Follow people from the Friends tab to see their game activity here.</p>
            </IonNote>
            <IonButton routerLink="/tabs/friends" style={{ marginTop: 16 }}>
              Find friends
            </IonButton>
          </div>
        )}

        {items && items.length > 0 && (
          <IonList lines="full">
            {items.map((it) => {
              const rating = it.userGame.rating != null ? Number(it.userGame.rating) : null;
              return (
                <IonItem
                  key={it.userGame.id}
                  button
                  detail={false}
                  routerLink={`/tabs/library/g/${it.userGame.igdbId}`}
                  className="game-card"
                >
                  <div slot="start" className="game-card__cover">
                    {it.game.coverUrl ? (
                      <img src={it.game.coverUrl} alt={it.game.name} loading="lazy" />
                    ) : (
                      <div className="game-card__cover-fallback">
                        <IonIcon icon={gameControllerOutline} />
                      </div>
                    )}
                  </div>
                  <IonLabel>
                    <p style={{ fontSize: 12, color: 'var(--ion-color-medium)', margin: '0 0 4px' }}>
                      <strong style={{ color: 'var(--ion-text-color)' }}>
                        @{it.actor.username}
                      </strong>{' '}
                      · {timeAgo(it.userGame.updatedAt)}
                    </p>
                    <h2 className="game-card__title">{it.game.name}</h2>
                    <div className="game-card__row">
                      <StatusBadge status={it.userGame.status} size="sm" />
                      {rating !== null && <StarRating value={rating} size={14} />}
                    </div>
                  </IonLabel>
                </IonItem>
              );
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Discover;
