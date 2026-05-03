import { IonItem, IonSkeletonText } from '@ionic/react';

const GameCardSkeleton: React.FC = () => (
  <IonItem className="game-card">
    <div slot="start" className="game-card__cover">
      <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
    </div>
    <div className="skeleton-row__lines">
      <IonSkeletonText animated style={{ width: '70%', height: 14 }} />
      <IonSkeletonText animated style={{ width: '50%', height: 11 }} />
      <IonSkeletonText animated style={{ width: '40%', height: 16, marginTop: 4 }} />
    </div>
  </IonItem>
);

export default GameCardSkeleton;
