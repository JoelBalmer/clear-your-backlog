import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSkeletonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { logOutOutline, mailOutline, openOutline } from 'ionicons/icons';
import { SignOutButton, useUser } from '@clerk/clerk-react';
import { useMe } from '../contexts/MeContext';

const Profile: React.FC = () => {
  const { user } = useUser();
  const { profile, status } = useMe();
  const loading = status === 'loading';

  const initial = (profile?.displayName ?? profile?.username ?? user?.firstName ?? '?')
    .slice(0, 1)
    .toUpperCase();
  const email = user?.primaryEmailAddress?.emailAddress;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="profile-header">
          <div className="profile-header__avatar">{initial}</div>
          {loading ? (
            <>
              <IonSkeletonText animated style={{ width: 120, height: 22 }} />
              <IonSkeletonText animated style={{ width: 80, height: 14 }} />
            </>
          ) : (
            <>
              <h1 className="profile-header__name">
                {profile?.displayName || profile?.username || 'Anonymous'}
              </h1>
              {profile?.username && <p className="profile-header__handle">@{profile.username}</p>}
            </>
          )}
        </div>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Account</IonLabel>
          </IonListHeader>
          {email && (
            <IonItem>
              <IonIcon slot="start" icon={mailOutline} />
              <IonLabel>
                <h3>Email</h3>
                <IonNote color="medium">{email}</IonNote>
              </IonLabel>
            </IonItem>
          )}
          {profile?.username && (
            <IonItem button detail routerLink={`/tabs/u/${profile.username}`}>
              <IonIcon slot="start" icon={openOutline} />
              <IonLabel>
                <h3>View public profile</h3>
                <IonNote color="medium">@{profile.username}</IonNote>
              </IonLabel>
            </IonItem>
          )}
          <SignOutButton>
            <IonItem button detail={false}>
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel color="danger">Sign out</IonLabel>
            </IonItem>
          </SignOutButton>
        </IonList>

        <div style={{ padding: '8px 16px 32px' }}>
          <IonNote color="medium" style={{ fontSize: 12 }}>
            Phase 5 of 7 — social features (friends, feed, public profiles) live.
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
