import { IonItem, IonLabel, IonNote } from '@ionic/react';
import type { Profile } from '../types/models';

const UserListItem: React.FC<{ profile: Profile; trailing?: React.ReactNode }> = ({
  profile,
  trailing,
}) => {
  const initial = (profile.displayName ?? profile.username ?? '?').slice(0, 1).toUpperCase();
  return (
    <IonItem button detail={!trailing} routerLink={trailing ? undefined : `/u/${profile.username}`}>
      <div
        slot="start"
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
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
        <h3 style={{ fontWeight: 600 }}>{profile.displayName || profile.username}</h3>
        <IonNote color="medium">@{profile.username}</IonNote>
      </IonLabel>
      {trailing && <div slot="end">{trailing}</div>}
    </IonItem>
  );
};

export default UserListItem;
