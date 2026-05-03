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
import { fetchRail } from '../lib/igdb/search';
import GameRail from '../components/GameRail';
import AddGameModal from '../components/AddGameModal';
import StatusBadge from '../components/StatusBadge';
import StarRating from '../components/StarRating';
import type { FeedItem, IgdbResult } from '../types/models';

type FeedResp = { items: FeedItem[] };

type RailState = {
  items: IgdbResult[] | null;
  error: string | null;
};

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

const RAILS = [
  { rail: 'popular' as const, title: 'Popular this season' },
  { rail: 'upcoming' as const, title: 'Coming soon' },
  { rail: 'top' as const, title: 'All-time greats' },
];

const Discover: React.FC = () => {
  const api = useApi();
  const [feed, setFeed] = useState<FeedItem[] | null>(null);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [rails, setRails] = useState<Record<string, RailState>>({
    popular: { items: null, error: null },
    upcoming: { items: null, error: null },
    top: { items: null, error: null },
  });
  const [igdbUnavailable, setIgdbUnavailable] = useState(false);
  const [pickedGame, setPickedGame] = useState<IgdbResult | null>(null);

  const loadFeed = useCallback(async () => {
    try {
      setFeedError(null);
      const r = await api<FeedResp>('/api/feed');
      setFeed(r.items);
    } catch (err) {
      if (err instanceof ApiError) setFeedError(`Failed (HTTP ${err.status})`);
      else setFeedError('Network error');
      setFeed([]);
    }
  }, [api]);

  const loadRails = useCallback(async () => {
    setIgdbUnavailable(false);
    await Promise.all(
      RAILS.map(async ({ rail }) => {
        try {
          const items = await fetchRail(api, rail);
          setRails((prev) => ({ ...prev, [rail]: { items, error: null } }));
        } catch (err) {
          let detail = 'Could not load';
          if (err instanceof ApiError) {
            if (err.status === 503) {
              setIgdbUnavailable(true);
              detail = 'IGDB credentials not configured';
            } else {
              detail = `HTTP ${err.status}`;
            }
          }
          setRails((prev) => ({ ...prev, [rail]: { items: [], error: detail } }));
        }
      }),
    );
  }, [api]);

  useEffect(() => {
    loadFeed();
    loadRails();
  }, [loadFeed, loadRails]);

  const reload = async () => {
    await Promise.all([loadFeed(), loadRails()]);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Discover</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonRefresher slot="fixed" onIonRefresh={(e) => reload().finally(() => e.detail.complete())}>
          <IonRefresherContent />
        </IonRefresher>

        {igdbUnavailable && (
          <div style={{ padding: '12px 16px 0' }}>
            <IonText color="medium">
              <p style={{ fontSize: 13, margin: 0 }}>
                Editorial rails need Twitch/IGDB credentials. See README → "Setting up Twitch / IGDB
                credentials".
              </p>
            </IonText>
          </div>
        )}

        {!igdbUnavailable &&
          RAILS.map(({ rail, title }) => (
            <GameRail
              key={rail}
              title={title}
              items={rails[rail].items}
              error={rails[rail].error}
              onPick={(g) => setPickedGame(g)}
            />
          ))}

        <h3
          style={{
            padding: '16px 16px 4px',
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: 'var(--ion-color-medium)',
          }}
        >
          Friends activity
        </h3>

        {feedError && (
          <IonText color="danger">
            <p style={{ padding: '0 16px' }}>{feedError}</p>
          </IonText>
        )}

        {feed === null && !feedError && (
          <div style={{ display: 'grid', placeItems: 'center', padding: 32 }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {feed && feed.length === 0 && !feedError && (
          <div className="empty-state" style={{ minHeight: 'auto', padding: '32px 32px 48px' }}>
            <div className="empty-state__icon" style={{ width: 72, height: 72 }}>
              <IonIcon icon={compassOutline} />
            </div>
            <h2 style={{ fontSize: 18 }}>No friend activity yet</h2>
            <IonNote color="medium">
              <p>Follow people from the Friends tab to see what they're playing.</p>
            </IonNote>
            <IonButton routerLink="/tabs/friends" style={{ marginTop: 16 }} size="small">
              Find friends
            </IonButton>
          </div>
        )}

        {feed && feed.length > 0 && (
          <IonList lines="full">
            {feed.map((it) => {
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

        <AddGameModal
          isOpen={!!pickedGame}
          initialGame={pickedGame}
          onDismiss={() => setPickedGame(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Discover;
