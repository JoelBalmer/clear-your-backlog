import { useEffect, useRef, useState } from 'react';
import {
  IonAlert,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { gameControllerOutline, trashOutline } from 'ionicons/icons';
import PlatformBadge from './PlatformBadge';
import StarRating from './StarRating';
import StatusChips from './StatusChips';
import TagPicker from './TagPicker';
import { useApi } from '../lib/api';
import { tap as hapticTap, success as hapticSuccess, warning as hapticWarning } from '../lib/haptics';
import type { GameStatus, UserGame, UserGameWithGame } from '../types/models';

type Props = {
  isOpen: boolean;
  item: UserGameWithGame | null;
  onDismiss: (changed: boolean) => void;
};

type UpdateResp = { userGame: UserGame };

const LibraryGameModal: React.FC<Props> = ({ isOpen, item, onDismiss }) => {
  const api = useApi();
  const changedRef = useRef(false);

  const [userGame, setUserGame] = useState<UserGame | null>(null);
  const [status, setStatus] = useState<GameStatus>('backlog');
  const [rating, setRating] = useState<number | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [playedOn, setPlayedOn] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (item) {
      changedRef.current = false;
      setUserGame(item.userGame);
      setStatus(item.userGame.status);
      setRating(item.userGame.rating != null ? Number(item.userGame.rating) : null);
      setNotesDraft(item.userGame.notes ?? '');
      setTagIds(item.tagIds ?? []);
      setPlayedOn(item.userGame.playedOn ?? null);
    }
  }, [item]);

  const patch = async (key: string, body: Record<string, unknown>) => {
    if (!userGame) return;
    hapticTap();
    setSavingField(key);
    changedRef.current = true;
    try {
      const r = await api<UpdateResp>(`/api/user-games/${userGame.id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      setUserGame(r.userGame);
    } catch (err) {
      console.error('[library-modal] patch failed:', err);
    } finally {
      setSavingField(null);
    }
  };

  const toggleTag = async (tagId: string) => {
    if (!userGame) return;
    const isLinked = tagIds.includes(tagId);
    const next = isLinked ? tagIds.filter((x) => x !== tagId) : [...tagIds, tagId];
    setTagIds(next);
    changedRef.current = true;
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
      setTagIds(tagIds);
      console.error('[library-modal] tag toggle failed:', err);
    }
  };

  const remove = async () => {
    if (!userGame) return;
    hapticWarning();
    try {
      await api(`/api/user-games/${userGame.id}`, { method: 'DELETE' });
      hapticSuccess();
      changedRef.current = true;
      onDismiss(true);
    } catch (err) {
      console.error('[library-modal] delete failed:', err);
    }
  };

  const game = item?.game;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => onDismiss(changedRef.current)}>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonButton color="danger" onClick={() => setConfirmDelete(true)} aria-label="Delete">
              <IonIcon icon={trashOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle>{game?.name ?? ''}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => onDismiss(changedRef.current)}>Done</IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {game && (
          <div className="page-narrow">
            <div className="detail-hero" style={{ padding: '12px 0' }}>
              <div className="detail-hero__cover" style={{ width: 80, height: 112 }}>
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
                    <IonIcon icon={gameControllerOutline} style={{ fontSize: 32 }} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="detail-hero__title">{game.name}</h2>
                {game.releaseYear && (
                  <p className="detail-hero__meta">{game.releaseYear}</p>
                )}
                {(game.platforms ?? []).length > 0 && (
                  <div className="detail-hero__platforms">
                    {(game.platforms ?? []).map((p) => (
                      <PlatformBadge
                        key={p}
                        name={p}
                        selected={playedOn === p}
                        onClick={() => {
                          const next = playedOn === p ? null : p;
                          setPlayedOn(next);
                          patch('playedOn', { playedOn: next });
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <IonList inset>
              <IonItem lines="none">
                <IonLabel>
                  <h3 className="section-h">
                    Status{' '}
                    {savingField === 'status' && (
                      <IonSpinner name="dots" style={{ height: 12 }} />
                    )}
                  </h3>
                  <StatusChips
                    value={status}
                    onChange={(s) => {
                      setStatus(s);
                      patch('status', { status: s });
                    }}
                  />
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>
                  <h3 className="section-h">
                    Your rating{' '}
                    {rating != null && (
                      <span className="section-h__suffix">· {rating.toFixed(1)}/10</span>
                    )}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StarRating
                      value={rating}
                      size={28}
                      onChange={(v) => {
                        setRating(v);
                        patch('rating', { rating: v });
                      }}
                    />
                    {rating != null && (
                      <IonButton
                        size="small"
                        fill="clear"
                        onClick={() => {
                          setRating(null);
                          patch('rating', { rating: null });
                        }}
                      >
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
                    if (notesDraft !== (userGame?.notes ?? '')) {
                      patch('notes', { notes: notesDraft });
                    }
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
          </div>
        )}

        <IonAlert
          isOpen={confirmDelete}
          onDidDismiss={() => setConfirmDelete(false)}
          header="Remove from library?"
          message={`This will delete your rating, notes, and tags for ${game?.name ?? 'this game'}.`}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            { text: 'Remove', role: 'destructive', handler: remove },
          ]}
        />
      </IonContent>
    </IonModal>
  );
};

export default LibraryGameModal;
