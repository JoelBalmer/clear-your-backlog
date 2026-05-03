import { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, gameControllerOutline, searchOutline } from 'ionicons/icons';
import StarRating from './StarRating';
import TagPicker from './TagPicker';
import { ApiError, useApi } from '../lib/api';
import { searchIgdb } from '../lib/igdb/search';
import type { GameStatus, IgdbResult } from '../types/models';

type Props = {
  isOpen: boolean;
  onDismiss: (added: boolean) => void;
  initialGame?: IgdbResult | null;
};

const STATUSES: { value: GameStatus; label: string }[] = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'playing', label: 'Playing' },
  { value: 'played', label: 'Played' },
  { value: 'dropped', label: 'Dropped' },
];

const AddGameModal: React.FC<Props> = ({ isOpen, onDismiss, initialGame }) => {
  const api = useApi();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<IgdbResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [picked, setPicked] = useState<IgdbResult | null>(initialGame ?? null);

  // Sync with initialGame when modal opens with a different pre-selected game.
  useEffect(() => {
    if (isOpen && initialGame) setPicked(initialGame);
  }, [isOpen, initialGame]);

  const [status, setStatus] = useState<GameStatus>('backlog');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || picked) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    setSearchError(null);
    debounceRef.current = setTimeout(async () => {
      try {
        const r = await searchIgdb(api, query);
        setResults(r);
      } catch (err) {
        const detail =
          err instanceof ApiError
            ? `HTTP ${err.status}${typeof err.body === 'object' && err.body && 'message' in err.body ? `: ${(err.body as { message: string }).message}` : ''}`
            : err instanceof Error
              ? err.message
              : 'Unknown error';
        setSearchError(detail);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, api, picked]);

  const reset = () => {
    setQuery('');
    setResults([]);
    setSearching(false);
    setSearchError(null);
    setPicked(null);
    setStatus('backlog');
    setRating(null);
    setNotes('');
    setTagIds([]);
    setSubmitting(false);
    setSubmitError(null);
  };

  const dismiss = (added: boolean) => {
    reset();
    onDismiss(added);
  };

  const onSave = async () => {
    if (!picked) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      await api('/api/user-games', {
        method: 'POST',
        body: JSON.stringify({
          igdbId: picked.igdbId,
          status,
          rating,
          notes: notes.trim() || undefined,
          tagIds,
          game: {
            name: picked.name,
            coverUrl: picked.coverUrl,
            platforms: picked.platforms,
            releaseYear: picked.releaseYear,
            summary: picked.summary,
          },
        }),
      });
      dismiss(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 409)
        setSubmitError('Already in your library.');
      else if (err instanceof ApiError) setSubmitError(`Failed (HTTP ${err.status})`);
      else setSubmitError('Network error. Try again.');
      setSubmitting(false);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => dismiss(false)}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{picked ? 'Add to library' : 'Search games'}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss(false)}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          {picked && (
            <IonButtons slot="start">
              <IonButton onClick={() => setPicked(null)}>Back</IonButton>
            </IonButtons>
          )}
        </IonToolbar>
      </IonHeader>
      <IonContent>
        {!picked && (
          <>
            <div style={{ padding: '12px 16px 0' }}>
              <IonItem lines="full">
                <IonIcon slot="start" icon={searchOutline} color="medium" />
                <IonInput
                  placeholder="Title (e.g. Hollow Knight)"
                  value={query}
                  onIonInput={(e) => setQuery(String(e.detail.value ?? ''))}
                  autocapitalize="off"
                  autocorrect="off"
                  clearInput
                />
                {searching && <IonSpinner name="dots" slot="end" />}
              </IonItem>
            </div>

            {searchError && (
              <div style={{ padding: '12px 16px' }}>
                <IonText color="danger">
                  <p style={{ margin: 0, fontSize: 14 }}>Search failed: {searchError}</p>
                </IonText>
              </div>
            )}

            {!searchError && !searching && query && results.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <IonNote>No matches.</IonNote>
              </div>
            )}

            {!query && !searchError && (
              <div style={{ padding: '24px 32px', textAlign: 'center' }}>
                <IonNote color="medium" style={{ fontSize: 13 }}>
                  Search the IGDB catalog to add games to your library.
                </IonNote>
              </div>
            )}

            <div>
              {results.map((r) => (
                <div key={r.igdbId} className="search-result" onClick={() => setPicked(r)}>
                  <div className="search-result__cover">
                    {r.coverUrl ? (
                      <img src={r.coverUrl} alt={r.name} loading="lazy" />
                    ) : (
                      <div
                        style={{
                          height: '100%',
                          display: 'grid',
                          placeItems: 'center',
                          color: 'var(--ion-color-medium)',
                        }}
                      >
                        <IonIcon icon={gameControllerOutline} />
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p className="search-result__title">{r.name}</p>
                    <p className="search-result__meta">
                      {r.releaseYear ? `${r.releaseYear}` : ''}
                      {r.releaseYear && r.platforms.length ? ' · ' : ''}
                      {r.platforms.slice(0, 3).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {picked && (
          <div className="page-narrow">
            <div className="detail-hero" style={{ padding: '12px 0' }}>
              <div className="detail-hero__cover" style={{ width: 80, height: 112 }}>
                {picked.coverUrl ? (
                  <img src={picked.coverUrl} alt={picked.name} />
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
                <h2 className="detail-hero__title">{picked.name}</h2>
                <p className="detail-hero__meta">
                  {picked.releaseYear ? `${picked.releaseYear}` : ''}
                  {picked.releaseYear && picked.platforms.length ? ' · ' : ''}
                  {picked.platforms.slice(0, 3).join(', ')}
                </p>
              </div>
            </div>

            <IonList inset>
              <IonItem lines="none">
                <IonLabel>
                  <h3 style={{ fontWeight: 600, margin: '0 0 8px' }}>Status</h3>
                  <IonSegment
                    value={status}
                    onIonChange={(e) => setStatus((e.detail.value as GameStatus) ?? 'backlog')}
                  >
                    {STATUSES.map((s) => (
                      <IonSegmentButton key={s.value} value={s.value}>
                        <IonLabel>{s.label}</IonLabel>
                      </IonSegmentButton>
                    ))}
                  </IonSegment>
                </IonLabel>
              </IonItem>
              <IonItem lines="none">
                <IonLabel>
                  <h3 style={{ fontWeight: 600, margin: '0 0 8px' }}>
                    Rating {rating != null && <span style={{ color: 'var(--ion-color-medium)', fontWeight: 400 }}>· {rating.toFixed(1)}/10</span>}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <StarRating value={rating} size={28} onChange={setRating} />
                    {rating != null && (
                      <IonButton size="small" fill="clear" onClick={() => setRating(null)}>
                        Clear
                      </IonButton>
                    )}
                  </div>
                </IonLabel>
              </IonItem>
              <IonItem>
                <IonTextarea
                  label="Notes"
                  labelPlacement="stacked"
                  placeholder="Optional"
                  value={notes}
                  onIonInput={(e) => setNotes(String(e.detail.value ?? ''))}
                  rows={3}
                  maxlength={1000}
                />
              </IonItem>
              <IonItem lines="none">
                <IonLabel>
                  <h3 style={{ fontWeight: 600, margin: '0 0 8px' }}>Tags</h3>
                  <TagPicker
                    selectedIds={tagIds}
                    onToggle={(id) =>
                      setTagIds((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                      )
                    }
                  />
                </IonLabel>
              </IonItem>
            </IonList>

            {submitError && (
              <IonText color="danger">
                <p style={{ padding: '0 24px', margin: '8px 0 0' }}>{submitError}</p>
              </IonText>
            )}

            <div style={{ padding: '16px' }}>
              <IonButton expand="block" onClick={onSave} disabled={submitting}>
                {submitting ? <IonSpinner name="dots" /> : 'Add to library'}
              </IonButton>
            </div>
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default AddGameModal;
