import { useState } from 'react';
import {
  IonAlert,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonNote,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSkeletonText,
  IonTitle,
  IonToggle,
  IonToolbar,
  useIonRouter,
} from '@ionic/react';
import {
  cloudDownloadOutline,
  contrastOutline,
  documentTextOutline,
  logOutOutline,
  mailOutline,
  notificationsOutline,
  openOutline,
  pricetagsOutline,
  shieldCheckmarkOutline,
  trashOutline,
} from 'ionicons/icons';
import { SignOutButton, useClerk, useUser } from '@clerk/clerk-react';
import { useApi, ApiError } from '../lib/api';
import { useMe } from '../contexts/MeContext';
import { useTheme, type ThemeChoice } from '../contexts/ThemeContext';
import ManageTagsModal from '../components/ManageTagsModal';
import SteamImportModal from '../components/SteamImportModal';
import ThemeButton from '../components/ThemeButton';
import { warning as hapticWarning, error as hapticError } from '../lib/haptics';

const APP_VERSION = '1.0.0';

const Profile: React.FC = () => {
  const { user } = useUser();
  const clerk = useClerk();
  const router = useIonRouter();
  const api = useApi();
  const { profile, status, reload } = useMe();
  const { choice, setChoice } = useTheme();
  const loading = status === 'loading';
  const [tagsOpen, setTagsOpen] = useState(false);
  const [steamImportOpen, setSteamImportOpen] = useState(false);
  const [emailOptOut, setEmailOptOut] = useState<boolean | null>(null);
  const [confirm1, setConfirm1] = useState(false);
  const [confirm2, setConfirm2] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const initial = (profile?.displayName ?? profile?.username ?? user?.firstName ?? '?')
    .slice(0, 1)
    .toUpperCase();
  const email = user?.primaryEmailAddress?.emailAddress;

  // Hydrate the digest toggle from the loaded profile (which has emailOptOut once migration runs)
  const profileEmailOptOut =
    profile && 'emailOptOut' in profile ? (profile as { emailOptOut?: boolean }).emailOptOut : false;
  const currentOptOut = emailOptOut ?? profileEmailOptOut ?? false;

  const toggleEmail = async (newOptOut: boolean) => {
    if (!profile) return;
    setEmailOptOut(newOptOut);
    try {
      await api('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ username: profile.username, displayName: profile.displayName, emailOptOut: newOptOut }),
      });
      reload();
    } catch (err) {
      console.error('[profile] email toggle failed:', err);
      setEmailOptOut(!newOptOut);
    }
  };

  const onDelete = async () => {
    setDeleteError(null);
    hapticWarning();
    try {
      await api('/api/account', { method: 'DELETE' });
      await clerk.signOut();
      router.push('/sign-in', 'root', 'replace');
    } catch (err) {
      hapticError();
      if (err instanceof ApiError) setDeleteError(`Failed (HTTP ${err.status})`);
      else setDeleteError('Network error. Try again.');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
          <IonButtons slot="end">
            <ThemeButton />
          </IonButtons>
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
            <IonItem button detail routerLink={`/u/${profile.username}`}>
              <IonIcon slot="start" icon={openOutline} />
              <IonLabel>
                <h3>View public profile</h3>
                <IonNote color="medium">@{profile.username}</IonNote>
              </IonLabel>
            </IonItem>
          )}
          <IonItem button detail onClick={() => setTagsOpen(true)}>
            <IonIcon slot="start" icon={pricetagsOutline} />
            <IonLabel>
              <h3>Manage tags</h3>
              <IonNote color="medium">Group your library by theme, platform, mood…</IonNote>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Data</IonLabel>
          </IonListHeader>
          <IonItem button detail onClick={() => setSteamImportOpen(true)}>
            <IonIcon slot="start" icon={cloudDownloadOutline} />
            <IonLabel>
              <h3>Import Steam library</h3>
              <IonNote color="medium">Add games from your Steam account</IonNote>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Appearance</IonLabel>
          </IonListHeader>
          <IonItem lines="none">
            <IonIcon slot="start" icon={contrastOutline} />
            <IonLabel>
              <h3>Theme</h3>
              <IonSegment
                value={choice}
                onIonChange={(e) => setChoice((e.detail.value as ThemeChoice) ?? 'dark')}
                style={{ marginTop: 8 }}
                scrollable
              >
                <IonSegmentButton value="dark">
                  <IonLabel>Dark</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="light">
                  <IonLabel>Light</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="synthwave">
                  <IonLabel>Synth</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="system">
                  <IonLabel>Auto</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </IonLabel>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Email preferences</IonLabel>
          </IonListHeader>
          <IonItem>
            <IonIcon slot="start" icon={notificationsOutline} />
            <IonLabel>
              <h3>Weekly digest</h3>
              <IonNote color="medium">A summary of friend activity, every Sunday</IonNote>
            </IonLabel>
            <IonToggle
              slot="end"
              checked={!currentOptOut}
              onIonChange={(e) => toggleEmail(!e.detail.checked)}
            />
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel>Legal</IonLabel>
          </IonListHeader>
          <IonItem button detail routerLink="/privacy">
            <IonIcon slot="start" icon={shieldCheckmarkOutline} />
            <IonLabel><h3>Privacy</h3></IonLabel>
          </IonItem>
          <IonItem button detail routerLink="/terms">
            <IonIcon slot="start" icon={documentTextOutline} />
            <IonLabel><h3>Terms</h3></IonLabel>
          </IonItem>
        </IonList>

        <IonList inset>
          <IonListHeader>
            <IonLabel color="danger">Danger zone</IonLabel>
          </IonListHeader>
          <SignOutButton>
            <IonItem button detail={false}>
              <IonIcon slot="start" icon={logOutOutline} />
              <IonLabel>Sign out</IonLabel>
            </IonItem>
          </SignOutButton>
          <IonItem button detail={false} onClick={() => setConfirm1(true)}>
            <IonIcon slot="start" icon={trashOutline} color="danger" />
            <IonLabel color="danger">Delete account</IonLabel>
          </IonItem>
        </IonList>

        <div style={{ padding: '8px 16px 32px', textAlign: 'center' }}>
          <IonNote color="medium" style={{ fontSize: 11 }}>
            Clear Your Backlog v{APP_VERSION}
          </IonNote>
        </div>

        <ManageTagsModal isOpen={tagsOpen} onDismiss={() => setTagsOpen(false)} />
        <SteamImportModal isOpen={steamImportOpen} onDismiss={() => setSteamImportOpen(false)} />

        <IonAlert
          isOpen={confirm1}
          onDidDismiss={() => setConfirm1(false)}
          header="Delete your account?"
          message="This permanently removes your library, ratings, tags, and social graph. It can't be undone."
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Continue',
              role: 'destructive',
              handler: () => {
                setConfirm1(false);
                setTimeout(() => setConfirm2(true), 250);
              },
            },
          ]}
        />
        <IonAlert
          isOpen={confirm2}
          onDidDismiss={() => setConfirm2(false)}
          header="Type DELETE to confirm"
          inputs={[{ name: 'word', type: 'text', placeholder: 'DELETE' }]}
          buttons={[
            { text: 'Cancel', role: 'cancel' },
            {
              text: 'Delete forever',
              role: 'destructive',
              handler: (data: { word?: string }) => {
                if (data?.word !== 'DELETE') return false;
                onDelete();
                return true;
              },
            },
          ]}
        />
        {deleteError && (
          <IonAlert
            isOpen={!!deleteError}
            onDidDismiss={() => setDeleteError(null)}
            header="Couldn't delete"
            message={deleteError}
            buttons={['OK']}
          />
        )}
      </IonContent>
    </IonPage>
  );
};

export default Profile;
