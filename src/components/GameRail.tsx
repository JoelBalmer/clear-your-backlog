import { IonIcon, IonSkeletonText } from '@ionic/react';
import { gameControllerOutline } from 'ionicons/icons';
import type { IgdbResult } from '../types/models';

type Props = {
  title: string;
  items: IgdbResult[] | null; // null = loading
  error?: string | null;
  onPick: (game: IgdbResult) => void;
};

const GameRail: React.FC<Props> = ({ title, items, error, onPick }) => {
  return (
    <section className="rail">
      <header className="rail__header">
        <h3 className="rail__title">{title}</h3>
      </header>

      {error && (
        <p className="rail__error">{error}</p>
      )}

      {!error && (
        <div className="rail__scroll">
          {items === null
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rail__card">
                  <IonSkeletonText animated style={{ width: '100%', height: '100%', borderRadius: 10 }} />
                </div>
              ))
            : items.length === 0
              ? <p className="rail__empty">Nothing to show here yet.</p>
              : items.map((g) => (
                  <button key={g.igdbId} className="rail__card" onClick={() => onPick(g)} type="button">
                    {g.coverUrl ? (
                      <img src={g.coverUrl} alt={g.name} loading="lazy" />
                    ) : (
                      <div className="rail__card-fallback">
                        <IonIcon icon={gameControllerOutline} />
                      </div>
                    )}
                    <div className="rail__card-overlay">
                      <span className="rail__card-title">{g.name}</span>
                      {g.releaseYear && <span className="rail__card-year">{g.releaseYear}</span>}
                    </div>
                  </button>
                ))}
        </div>
      )}
    </section>
  );
};

export default GameRail;
