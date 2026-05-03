import { useCallback, useEffect, useState } from 'react';
import {
  IonAlert,
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
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { gameControllerOutline, trashOutline } from 'ionicons/icons';
import { useHistory, useParams } from 'react-router-dom';
import { ApiError, useApi } from '../lib/api';
import StarRating from '../components/StarRating';
import StatusBadge from '../components/StatusBadge';
import StatusChips from '../components/StatusChips';
import TagPicker from '../components/TagPicker';
import { tap as hapticTap, success as hapticSuccess, warning as hapticWarning } from '../lib/haptics';
import type { FriendPlayedItem, Game, UserGame, UserGameWithGame } from '../types/models';

type ListResp = { items: UserGameWithGame[] };
type GameResp = { game: Game };
type UpdateResp = { userGame: UserGame };
type FriendsResp = { items: FriendPlayedItem[] };

const GameDetail: React.FC = () => {
  const { igdbId } = useParams<{ igdbId: string }>();
  const api = useApi();
  const history = useHistory();
  const id = Number(igdbId);

  const [game, setGame] = useState<Game | null>(null);
  const [userGame, setUserGame] = useState<UserGame | null>(null);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [friends, setFriends] = useState<FriendPlayedItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notesDraft, setNotesDraft] = useState('');

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [gameR, listR, friendsR] = await Promise.all([
        api<GameResp>(`/api/games/${id}`),
        api<ListResp>(`/api/user-games`),
        api<FriendsResp>(`/api/game-friends?igdbId=${id}`).catch(() => ({ items: [] })),
      ]);
      setGame(gameR.game);
      const mine = listR.items.find((it) => it.userGame.igdbId === id);
      setUserGame(mine?.userGame ?? null);
      setTagIds(mine?.tagIds ?? []);
      setNotesDraft(mine?.userGame.notes ?? '');
      setFriends(friendsR.items);
    } catch (err) {
      if (err instanceof ApiError) setLoadError(`HTTP ${err.status}`);
      else setLoadError('Network error');
    }
  }, [api, id]);

  useEffect(() => {
    if (Number.isFinite(id)) load();
  }, [id, load]);

  const patch = async (key: string, body: Record<string, unknown>) => {
    if (!userGame) return;
    hapticTap();
    setSavingField(key);
    try {
      const r = await api<UpdateResp>(`/api/user-games/${userGame.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setUserGame(r.userGame);
    } catch (err) {
      console.error('[game-detail] patch failed:', err);
    } finally {
      setSavingField(null);
    }
  };

  const toggleTag = async (tagId: string) => {
    if (!userGame) return;
    const isLinked = tagIds.includes(tagId);
    const next = isLinked ? tagIds.filter((x) => x !== tagId) : [...tagIds, tagId];
    setTagIds(next);
    try {
      if (isLinked) {
        await api(
          `/api/user-game-tags?userGameId=${userGame.id}&tagId=${encodeURIComponent(tagId)}`,
          { method: 'DELETE' },
        );
      } else {
        await api('/api/user-game-tags', {
          method: 'POST',
          body: JSON.stringify({ userGameId: userGame.id, tagId }),
        });
      }
    } catch (err) {
      // revert
      setTagIds(tagIds);
      console.error('[game-detail] tag toggle failed:', err);
    }
  };

  const remove = async () => {
    if (!userGame) return;
    hapticWarning();
    try {
      await api(`/api/user-games/${userGame.id}`, { method: 'DELETE' });
      hapticSuccess();
      history.replace('/tabs/library');
    } catch (err) {
      console.error('[game-detail] delete failed:', err);
    }
  };

  if (loadError) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/library" />
            </IonButtons>
            <IonTitle>Game</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="empty-state">
            <h2>Could not load game</h2>
            <IonNote color="medium">
              <p>{loadError}</p>
            </IonNote>
            <IonButton onClick={load} style={{ marginTop: 12 }}>
              Retry
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!game) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/library" />
            </IonButtons>
            <IonTitle>Game</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div style={{ display: 'grid', placeItems: 'center', padding: 64 }}>
            <IonSpinner name="crescent" />
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const ratingNum = userGame?.rating != null ? Number(userGame.rating) : null;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/library" />
          </IonButtons>
          <IonTitle>{game.name}</IonTitle>
          {userGame && (
            <IonButtons slot="end">
              <IonButton color="danger" onClick={() => setConfirmDelete(true)}>
                <IonIcon icon={trashOutline} />
              </IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="detail-hero">
          <div className="detail-hero__cover">
            {game.coverUrl ? (
              <img src={game.coverUrl} alt={game.name} />
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--ion-color-medium)',
                }}
              >
                <IonIcon icon={gameControllerOutline} style={{ fontSize: 48 }} />
              </div>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 className="detail-hero__title">{game.name}</h1>
            <p className="detail-hero__meta">
              {game.releaseYear ? `${game.releaseYear}` : ''}
              {game.releaseYear && (game.platforms?.length ?? 0) > 0 ? ' · ' : ''}
              {(game.platforms ?? []).slice(0, 4).join(', ')}
            </p>
          </div>
        </div>

        {userGame ? (
          <IonList inset>
            <IonItem lines="none">
              <IonLabel>
                <h3 className="section-h">
                  Status {savingField === 'status' && <IonSpinner name="dots" style={{ height: 12 }} />}
                </h3>
                <StatusChips
                  value={userGame.status}
                  onChange={(s) => patch('status', { status: s })}
                />
              </IonLabel>
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3 className="section-h">
                  Your rating{' '}
                  {ratingNum != null && (
                    <span className="section-h__suffix">· {ratingNum.toFixed(1)}/10</span>
                  )}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <StarRating value={ratingNum} size={28} onChange={(v) => patch('rating', { rating: v })} />
                  {ratingNum != null && (
                    <IonButton size="small" fill="clear" onClick={() => patch('rating', { rating: null })}>
                      Clear
                    </IonButton>
                  )}
                </div>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonTextarea
                label="Review (public)"
                labelPlacement="stacked"
                placeholder="What did you think? Visible on your profile."
                value={notesDraft}
                onIonInput={(e) => setNotesDraft(String(e.detail.value ?? ''))}
                onIonBlur={() => {
                  if (notesDraft !== (userGame.notes ?? '')) patch('notes', { notes: notesDraft });
                }}
                rows={4}
                maxlength={2000}
                autoGrow
              />
            </IonItem>
            <IonItem lines="none">
              <IonLabel>
                <h3 className="section-h">Tags</h3>
                <TagPicker selectedIds={tagIds} onToggle={toggleTag} />
              </IonLabel>
            </IonItem>
          </IonList>
        ) : (
          <div style={{ padding: '0 16px' }}>
            <IonText color="medium">
              <p>Not in your library yet.</p>
            </IonText>
          </div>
        )}

        {friends.length > 0 && (
          <>
            <h3 className="block-h">
              Friends who played
            </h3>
            <IonList lines="full">
              {friends.map((f) => {
                const r = f.userGame.rating != null ? Number(f.userGame.rating) : null;
                return (
                  <IonItem
                    key={f.profile.id}
                    button
                    detail={false}
                    routerLink={`/u/${f.profile.username}`}
                  >
                    <div
                      slot="start"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--brand-amber, #f59e0b), var(--brand-coral, #fb7185))',
                        color: 'white',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      {(f.profile.displayName ?? f.profile.username).slice(0, 1).toUpperCase()}
                    </div>
                    <IonLabel className="friend-played">
                      <h3 className="friend-played__name">
                        {f.profile.displayName || f.profile.username}
                      </h3>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                        <StatusBadge status={f.userGame.status} size="sm" />
                        {r !== null && <StarRating value={r} size={12} />}
                      </div>
                      {f.userGame.notes && (
                        <p className="friend-played__review">"{f.userGame.notes}"</p>
                      )}
                    </IonLabel>
                  </IonItem>
                );
              })}
            </IonList>
          </>
        )}

        {game.summary && (
          <>
            <h3 className="block-h">About</h3>
            <p className="detail-summary">{game.summary}</p>
          </>
        )}

        <IonAlert
          isOpen={confirmDelete}
          onDidDismiss={() => setConfirmDelete(false)}
          header="Remove from library?"
          message={`This will delete your rating, notes, and tags for ${game.name}.`}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Remove', role: 'destructive', handler: remove },
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default GameDetail;
