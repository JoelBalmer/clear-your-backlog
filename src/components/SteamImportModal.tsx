import { useEffect, useRef, useState } from 'react';
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonModal,
  IonNote,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  closeOutline,
  gameControllerOutline,
  searchOutline,
} from 'ionicons/icons';
import StarRating from './StarRating';
import PlatformBadge from './PlatformBadge';
import { ApiError, useApi } from '../lib/api';
import { searchIgdb } from '../lib/igdb/search';
import type { GameStatus, IgdbResult } from '../types/models';

type IgdbMatchResult = {
  igdbId: number;
  name: string;
  coverUrl: string | null;
  platforms: string[];
  releaseYear: number | null;
  summary: string | null;
};

type SteamGame = {
  steamAppId: number;
  steamName: string;
  playtimeMinutes: number;
  igdbMatch: IgdbMatchResult | null;
  matchConfidence: 'exact' | 'likely' | 'none';
};

type ReviewGame = SteamGame & {
  included: boolean;
  status: GameStatus;
  rating: number | null;
};

type Step = 'input' | 'loading' | 'review' | 'importing' | 'done';

type Props = {
  isOpen: boolean;
  onDismiss: (imported: boolean) => void;
};

const STATUS_COLORS: Record<GameStatus, string> = {
  backlog: '#6b7280',
  playing: '#10b981',
  played: '#6366f1',
  dropped: '#ef4444',
  wishlist: '#f59e0b',
};

function formatPlaytime(minutes: number): string {
  if (minutes === 0) return 'Never played';
  if (minutes < 60) return `${minutes}m on Steam`;
  return `${Math.round(minutes / 60)}h on Steam`;
}

function defaultStatus(playtimeMinutes: number): GameStatus {
  return playtimeMinutes > 0 ? 'played' : 'backlog';
}

// ── Review row ────────────────────────────────────────────────────────────────

type RowProps = {
  game: ReviewGame;
  onUpdate: (steamAppId: number, patch: Partial<ReviewGame>) => void;
  onFindMatch: (steamAppId: number) => void;
};

const ReviewRow: React.FC<RowProps> = ({ game, onUpdate, onFindMatch }) => {
  const { steamAppId, steamName, playtimeMinutes, igdbMatch, matchConfidence, included, status, rating } = game;

  return (
    <div className={`steam-review-row${included ? '' : ' steam-review-row--excluded'}`}>
      <IonCheckbox
        className="steam-review-row__check"
        checked={included}
        onIonChange={(e) => onUpdate(steamAppId, { included: e.detail.checked })}
      />
      <div className="steam-review-row__cover">
        {igdbMatch?.coverUrl ? (
          <img src={igdbMatch.coverUrl} alt={igdbMatch.name} />
        ) : (
          <IonIcon icon={gameControllerOutline} style={{ fontSize: 18, color: 'var(--ion-color-medium)' }} />
        )}
      </div>
      <div className="steam-review-row__info">
        <div className="steam-review-row__name">
          {igdbMatch ? igdbMatch.name : steamName}
        </div>
        <div className="steam-review-row__meta">
          {formatPlaytime(playtimeMinutes)}
          {matchConfidence === 'likely' && ' · approx. match'}
          {matchConfidence === 'none' && ' · no IGDB match'}
        </div>
        {included && igdbMatch && (
          <div className="steam-review-row__controls">
            <select
              value={status}
              onChange={(e) => onUpdate(steamAppId, { status: e.target.value as GameStatus })}
              style={{
                appearance: 'none',
                WebkitAppearance: 'none',
                background: `${STATUS_COLORS[status]}20`,
                color: STATUS_COLORS[status],
                border: `1px solid ${STATUS_COLORS[status]}44`,
                borderRadius: 999,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value="backlog">Backlog</option>
              <option value="playing">Playing</option>
              <option value="played">Played</option>
              <option value="dropped">Dropped</option>
              <option value="wishlist">Wishlist</option>
            </select>
            <StarRating
              value={rating}
              size={15}
              onChange={(v) => onUpdate(steamAppId, { rating: v })}
            />
            {rating != null && (
              <button
                className="steam-review-row__clear-rating"
                onClick={() => onUpdate(steamAppId, { rating: null })}
              >
                ✕
              </button>
            )}
          </div>
        )}
        {included && !igdbMatch && (
          <IonButton
            size="small"
            fill="clear"
            style={{ height: 'auto', marginTop: 4, padding: 0, fontSize: 12 }}
            onClick={() => onFindMatch(steamAppId)}
          >
            Find IGDB match →
          </IonButton>
        )}
      </div>
    </div>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────

const SteamImportModal: React.FC<Props> = ({ isOpen, onDismiss }) => {
  const api = useApi();
  const [step, setStep] = useState<Step>('input');
  const [steamId, setSteamId] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [skippedCount, setSkippedCount] = useState(0);
  const [games, setGames] = useState<ReviewGame[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importTotal, setImportTotal] = useState(0);
  const [importedCount, setImportedCount] = useState(0);

  // Find-match sub-modal state
  const [findMatchFor, setFindMatchFor] = useState<number | null>(null);
  const [matchQuery, setMatchQuery] = useState('');
  const [matchResults, setMatchResults] = useState<IgdbResult[]>([]);
  const [matchSearching, setMatchSearching] = useState(false);
  const matchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setStep('input');
    setSteamId('');
    setFetchError(null);
    setGames([]);
    setSkippedCount(0);
    setImportProgress(0);
    setImportTotal(0);
    setImportedCount(0);
  }, [isOpen]);

  // Debounced IGDB search for the find-match sub-modal
  useEffect(() => {
    if (matchDebounce.current) clearTimeout(matchDebounce.current);
    if (!matchQuery.trim()) {
      setMatchResults([]);
      setMatchSearching(false);
      return;
    }
    setMatchSearching(true);
    matchDebounce.current = setTimeout(async () => {
      try {
        const r = await searchIgdb(api, matchQuery);
        setMatchResults(r);
      } catch {
        setMatchResults([]);
      } finally {
        setMatchSearching(false);
      }
    }, 350);
    return () => {
      if (matchDebounce.current) clearTimeout(matchDebounce.current);
    };
  }, [matchQuery, api]);

  const updateGame = (steamAppId: number, patch: Partial<ReviewGame>) => {
    setGames((prev) => prev.map((g) => (g.steamAppId === steamAppId ? { ...g, ...patch } : g)));
  };

  const fetchLibrary = async () => {
    if (!steamId.trim()) return;
    setFetchError(null);
    setStep('loading');
    try {
      const r = await api<{ games: SteamGame[]; alreadyOwnedCount: number }>('/api/steam-import', {
        method: 'POST',
        body: JSON.stringify({ steamId: steamId.trim() }),
      });
      setSkippedCount(r.alreadyOwnedCount);
      setGames(
        r.games.map((g) => ({
          ...g,
          included: true,
          status: defaultStatus(g.playtimeMinutes),
          rating: null,
        })),
      );
      setStep('review');
    } catch (err) {
      const msg =
        err instanceof ApiError ? `Error ${err.status}` : 'Network error. Try again.';
      setFetchError(msg);
      setStep('input');
    }
  };

  const runImport = async () => {
    const toImport = games.filter((g) => g.included && g.igdbMatch);
    if (toImport.length === 0) return;
    setImportTotal(toImport.length);
    setImportProgress(0);
    setStep('importing');

    let imported = 0;
    for (const game of toImport) {
      try {
        const igdbId = game.igdbMatch!.igdbId;

        // Fetch real IGDB metadata so the library shows the correct cover art.
        // Falls back to the mock data if the fetch fails.
        let gameData = {
          name: game.igdbMatch!.name,
          coverUrl: game.igdbMatch!.coverUrl,
          platforms: game.igdbMatch!.platforms,
          releaseYear: game.igdbMatch!.releaseYear,
          summary: game.igdbMatch!.summary,
        };
        try {
          const r = await api<{ game: { name: string; coverUrl: string | null; platforms: string[] | null; releaseYear: number | null; summary: string | null } }>(`/api/games/${igdbId}`);
          gameData = {
            name: r.game.name,
            coverUrl: r.game.coverUrl,
            platforms: r.game.platforms ?? [],
            releaseYear: r.game.releaseYear,
            summary: r.game.summary,
          };
        } catch {
          // non-fatal: proceed with mock metadata
        }

        await api('/api/user-games', {
          method: 'POST',
          body: JSON.stringify({
            igdbId,
            status: game.status,
            rating: game.rating,
            game: gameData,
          }),
        });
        imported++;
      } catch (err) {
        // 409 = already owned, skip silently; other errors are non-fatal
        if (!(err instanceof ApiError && err.status === 409)) {
          console.error('[steam-import] failed to add game:', game.igdbMatch?.name, err);
        }
      }
      setImportProgress((prev) => prev + 1);
    }

    setImportedCount(imported);
    setStep('done');
  };

  const dismiss = (imported: boolean) => {
    onDismiss(imported);
  };

  const includedCount = games.filter((g) => g.included && g.igdbMatch).length;
  const pct = importTotal > 0 ? (importProgress / importTotal) * 100 : 0;

  const stepTitle: Record<Step, string> = {
    input: 'Import from Steam',
    loading: 'Fetching library…',
    review: 'Review import',
    importing: 'Importing…',
    done: 'Import complete',
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => dismiss(false)}>
      <IonHeader>
        <IonToolbar>
          {step === 'review' && (
            <IonButtons slot="start">
              <IonButton onClick={() => setStep('input')}>Back</IonButton>
            </IonButtons>
          )}
          <IonTitle>{stepTitle[step]}</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={() => dismiss(step === 'done' && importedCount > 0)}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* ── Input ──────────────────────────────────────────────────────── */}
        {step === 'input' && (
          <div style={{ padding: '24px 16px' }}>
            <p style={{ fontSize: 14, color: 'var(--ion-color-medium)', marginTop: 0, marginBottom: 16 }}>
              Enter your Steam profile URL or Steam64 ID. Your game list must be set to public in Steam privacy settings.
            </p>
            <IonItem lines="full">
              <IonInput
                label="Steam profile URL or ID"
                labelPlacement="stacked"
                placeholder="https://steamcommunity.com/id/yourname"
                value={steamId}
                onIonInput={(e) => setSteamId(String(e.detail.value ?? ''))}
                onKeyUp={(e) => e.key === 'Enter' && fetchLibrary()}
                clearInput
              />
            </IonItem>
            {fetchError && (
              <IonText color="danger">
                <p style={{ fontSize: 13, margin: '8px 0 0' }}>{fetchError}</p>
              </IonText>
            )}
            <IonButton
              expand="block"
              style={{ marginTop: 16 }}
              disabled={!steamId.trim()}
              onClick={fetchLibrary}
            >
              Fetch library
            </IonButton>
            <p style={{ fontSize: 11, color: 'var(--ion-color-medium)', textAlign: 'center', marginTop: 12 }}>
              Preview: using sample Steam library data.
            </p>
          </div>
        )}

        {/* ── Loading ────────────────────────────────────────────────────── */}
        {step === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 64, gap: 16 }}>
            <IonSpinner name="crescent" style={{ width: 48, height: 48 }} />
            <IonNote>Fetching Steam library…</IonNote>
          </div>
        )}

        {/* ── Review ────────────────────────────────────────────────────── */}
        {step === 'review' && (
          <>
            <div className="steam-review-header">
              <IonNote>
                {games.length} game{games.length !== 1 ? 's' : ''} found
                {skippedCount > 0 && ` · ${skippedCount} already in library`}
              </IonNote>
            </div>
            {games.map((game) => (
              <ReviewRow
                key={game.steamAppId}
                game={game}
                onUpdate={updateGame}
                onFindMatch={setFindMatchFor}
              />
            ))}
            {games.length === 0 && (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <IonNote>All Steam games are already in your library.</IonNote>
              </div>
            )}
          </>
        )}

        {/* ── Importing ─────────────────────────────────────────────────── */}
        {step === 'importing' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 64, gap: 20 }}>
            <IonSpinner name="crescent" style={{ width: 48, height: 48 }} />
            <IonNote>
              Adding {importProgress} of {importTotal}…
            </IonNote>
            <div className="steam-progress-track">
              <div className="steam-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}

        {/* ── Done ──────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 64, gap: 16, textAlign: 'center' }}>
            <IonIcon
              icon={checkmarkCircleOutline}
              style={{ fontSize: 64, color: 'var(--ion-color-success)' }}
            />
            <h2 style={{ margin: 0 }}>
              {importedCount} game{importedCount !== 1 ? 's' : ''} added
            </h2>
            {importTotal - importedCount > 0 && (
              <IonNote>{importTotal - importedCount} skipped (already in library)</IonNote>
            )}
            <IonButton expand="block" style={{ marginTop: 8, minWidth: 200 }} onClick={() => dismiss(true)}>
              Done
            </IonButton>
          </div>
        )}
      </IonContent>

      {/* ── Review footer ─────────────────────────────────────────────────── */}
      {step === 'review' && (
        <IonFooter>
          <IonToolbar>
            <div style={{ padding: '8px 16px' }}>
              <IonButton
                expand="block"
                disabled={includedCount === 0}
                onClick={runImport}
              >
                Import {includedCount} game{includedCount !== 1 ? 's' : ''}
              </IonButton>
            </div>
          </IonToolbar>
        </IonFooter>
      )}

      {/* ── Find Match sub-modal ──────────────────────────────────────────── */}
      <IonModal
        isOpen={findMatchFor !== null}
        onDidDismiss={() => {
          setFindMatchFor(null);
          setMatchQuery('');
          setMatchResults([]);
        }}
        initialBreakpoint={0.85}
        breakpoints={[0, 0.85, 1]}
      >
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonButton onClick={() => setFindMatchFor(null)}>Cancel</IonButton>
            </IonButtons>
            <IonTitle>Find IGDB match</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          {findMatchFor !== null && (
            <div style={{ padding: '8px 16px 0' }}>
              <p style={{ fontSize: 13, color: 'var(--ion-color-medium)', margin: '0 0 12px' }}>
                Steam game:{' '}
                <strong>{games.find((g) => g.steamAppId === findMatchFor)?.steamName}</strong>
              </p>
            </div>
          )}
          <div style={{ padding: '0 16px 8px' }}>
            <IonItem lines="full">
              <IonIcon slot="start" icon={searchOutline} color="medium" />
              <IonInput
                placeholder="Search IGDB…"
                value={matchQuery}
                onIonInput={(e) => setMatchQuery(String(e.detail.value ?? ''))}
                clearInput
              />
              {matchSearching && <IonSpinner name="dots" slot="end" />}
            </IonItem>
          </div>
          {!matchQuery && (
            <div style={{ padding: '24px 32px', textAlign: 'center' }}>
              <IonNote color="medium" style={{ fontSize: 13 }}>
                Type a title to search the IGDB catalog.
              </IonNote>
            </div>
          )}
          {matchQuery && !matchSearching && matchResults.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <IonNote>No matches.</IonNote>
            </div>
          )}
          {matchResults.map((r) => (
            <div
              key={r.igdbId}
              className="search-result"
              onClick={() => {
                if (findMatchFor !== null) {
                  updateGame(findMatchFor, {
                    igdbMatch: {
                      igdbId: r.igdbId,
                      name: r.name,
                      coverUrl: r.coverUrl,
                      platforms: r.platforms,
                      releaseYear: r.releaseYear,
                      summary: r.summary,
                    },
                    matchConfidence: 'exact',
                  });
                }
                setFindMatchFor(null);
                setMatchQuery('');
                setMatchResults([]);
              }}
            >
              <div className="search-result__cover">
                {r.coverUrl ? (
                  <img src={r.coverUrl} alt={r.name} loading="lazy" />
                ) : (
                  <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: 'var(--ion-color-medium)' }}>
                    <IonIcon icon={gameControllerOutline} />
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="search-result__title">{r.name}</p>
                {r.releaseYear && <p className="search-result__meta">{r.releaseYear}</p>}
                {r.platforms.length > 0 && (
                  <div className="search-result__platforms">
                    {r.platforms.slice(0, 3).map((p) => (
                      <PlatformBadge key={p} name={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </IonContent>
      </IonModal>
    </IonModal>
  );
};

export default SteamImportModal;
