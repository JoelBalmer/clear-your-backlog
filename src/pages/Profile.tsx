import { useEffect, useState } from 'react';
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
import { logOutOutline, mailOutline } from 'ionicons/icons';
import { SignOutButton, useUser } from '@clerk/clerk-react';
import { useApi } from '../lib/api';
import type { Profile as ProfileT } from '../types/models';

type MeResp = { profile: ProfileT | null; needsOnboarding: boolean };

const Profile: React.FC = () => {
  const { user } = useUser();
  const api = useApi();
  const [profile, setProfile] = useState<ProfileT | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api<MeResp>('/api/me')
      .then((r) => !cancelled && setProfile(r.profile))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [api]);

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
              {profile?.username && (
                <p className="profile-header__handle">@{profile.username}</p>
              )}
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
          <SignOutButton>
            <IonItem button detail={false}>
              <IonIcon slot="start" icon={logOutOutline} color="danger" />
              <IonLabel color="danger">Sign out</IonLabel>
            </IonItem>
          </SignOutButton>
        </IonList>

        <div style={{ padding: '8px 16px 32px' }}>
          <IonNote color="medium" style={{ fontSize: 12 }}>
            Phase 3 of 7 — auth complete. Library, Discover, and Friends are placeholders until
            Phases 4–5 land.
          </IonNote>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
