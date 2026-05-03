import { IonItem, IonLabel, IonNote } from '@ionic/react';
import type { Profile } from '../types/models';

const UserListItem: React.FC<{ profile: Profile; trailing?: React.ReactNode }> = ({
  profile,
  trailing,
}) => {
  const initial = (profile.displayName ?? profile.username ?? '?').slice(0, 1).toUpperCase();
  // Always make the row navigable. The trailing element (e.g. a Follow button)
  // is responsible for stopping its own click propagation.
  return (
    <IonItem button detail={!trailing} routerLink={`/u/${profile.username}`}>
      <div
        slot="start"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--brand-amber, #f59e0b), var(--brand-coral, #fb7185))',
          color: 'white',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
          fontSize: 16,
        }}
      >
        {initial}
      </div>
      <IonLabel>
        <h3 style={{ fontWeight: 600, fontSize: 15 }}>{profile.displayName || profile.username}</h3>
        <IonNote color="medium" style={{ fontSize: 13 }}>@{profile.username}</IonNote>
      </IonLabel>
      {trailing && <div slot="end">{trailing}</div>}
    </IonItem>
  );
};

export default UserListItem;
