import { IonItem, IonSkeletonText } from '@ionic/react';

const UserListItemSkeleton: React.FC = () => (
  <IonItem>
    <div
      slot="start"
      style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden' }}
    >
      <IonSkeletonText animated style={{ width: '100%', height: '100%' }} />
    </div>
    <div className="skeleton-row__lines">
      <IonSkeletonText animated style={{ width: '40%', height: 14 }} />
      <IonSkeletonText animated style={{ width: '30%', height: 11 }} />
    </div>
  </IonItem>
);

export default UserListItemSkeleton;
