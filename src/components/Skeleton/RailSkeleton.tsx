import { IonSkeletonText } from '@ionic/react';

const RailSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="skeleton-rail">
    {Array.from({ length: count }).map((_, i) => (
      <IonSkeletonText key={i} animated className="skeleton-rail__card" />
    ))}
  </div>
);

export default RailSkeleton;
