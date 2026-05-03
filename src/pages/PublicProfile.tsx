import { useCallback, useEffect, useState } from 'react';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { gameControllerOutline } from 'ionicons/icons';
import { useParams } from 'react-router-dom';
import { ApiError, useApi } from '../lib/api';
import StatusBadge from '../components/StatusBadge';
import StarRating from '../components/StarRating';
import type { PublicProfile as PProfile, UserGameWithGame } from '../types/models';

type PProfileResp = PProfile;
type ListResp = { items: UserGameWithGame[] };

const PublicProfile: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const api = useApi();
  const [data, setData] = useState<PProfile | null>(null);
  const [library, setLibrary] = useState<UserGameWithGame[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const r = await api<PProfileResp>(`/api/users/${encodeURIComponent(username)}`);
      setData(r);
      const lib = await api<ListResp>(`/api/user-games?userId=${r.profile.id}&sort=rating`);
      setLibrary(lib.items);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) setError('User not found');
      else if (err instanceof ApiError) setError(`HTTP ${err.status}`);
      else setError('Network error');
    }
  }, [api, username]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFollow = async () => {
    if (!data || data.isSelf) return;
    setWorking(true);
    try {
      if (data.isFollowing) {
        await api(`/api/follows?followingId=${data.profile.id}`, { method: 'DELETE' });
        setData({
          ...data,
          isFollowing: false,
          counts: { ...data.counts, followers: Math.max(0, data.counts.followers - 1) },
        });
      } else {
        await api(`/api/follows`, {
          method: 'POST',
          body: JSON.stringify({ followingId: data.profile.id }),
        });
        setData({
          ...data,
          isFollowing: true,
          counts: { ...data.counts, followers: data.counts.followers + 1 },
        });
      }
    } catch (err) {
      console.error('[public-profile] toggle failed:', err);
    } finally {
      setWorking(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/friends" />
          </IonButtons>
          <IonTitle>{data?.profile.username ? `@${data.profile.username}` : ''}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        {!data && !error && (
          <div style={{ display: 'grid', placeItems: 'center', padding: 64 }}>
            <IonSpinner name="crescent" />
          </div>
        )}

        {error && (
          <div className="empty-state">
            <h2>{error}</h2>
            <IonButton onClick={load} style={{ marginTop: 12 }}>
              Retry
            </IonButton>
          </div>
        )}

        {data && (
          <>
            <div className="profile-header">
              <div className="profile-header__avatar">
                {(data.profile.displayName ?? data.profile.username).slice(0, 1).toUpperCase()}
              </div>
              <h1 className="profile-header__name">
                {data.profile.displayName || data.profile.username}
              </h1>
              <p className="profile-header__handle">@{data.profile.username}</p>
              {data.profile.bio && (
                <IonText color="medium">
                  <p style={{ maxWidth: 320, fontSize: 14, margin: '8px 0 0' }}>
                    {data.profile.bio}
                  </p>
                </IonText>
              )}

              <div style={{ display: 'flex', gap: 24, marginTop: 16, marginBottom: 8 }}>
                <Stat n={data.counts.gamesPlayed} label="Games" />
                <Stat n={data.counts.followers} label="Followers" />
                <Stat n={data.counts.following} label="Following" />
              </div>

              {!data.isSelf && (
                <IonButton onClick={toggleFollow} disabled={working} fill={data.isFollowing ? 'outline' : 'solid'} style={{ marginTop: 8 }}>
                  {working ? <IonSpinner name="dots" /> : data.isFollowing ? 'Following' : 'Follow'}
                </IonButton>
              )}
            </div>

            <h3
              style={{
                padding: '8px 16px 4px',
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: 0.5,
                color: 'var(--ion-color-medium)',
                textTransform: 'uppercase',
              }}
            >
              Top rated
            </h3>
            {library.length === 0 ? (
              <div style={{ padding: '16px 24px' }}>
                <IonNote color="medium">No games yet.</IonNote>
              </div>
            ) : (
              <IonList lines="full">
                {library.slice(0, 20).map((it) => {
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
          </>
        )}
      </IonContent>
    </IonPage>
  );
};

const Stat: React.FC<{ n: number; label: string }> = ({ n, label }) => (
  <div style={{ textAlign: 'center' }}>
    <div style={{ fontSize: 18, fontWeight: 700 }}>{n}</div>
    <div style={{ fontSize: 11, color: 'var(--ion-color-medium)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {label}
    </div>
  </div>
);

export default PublicProfile;
