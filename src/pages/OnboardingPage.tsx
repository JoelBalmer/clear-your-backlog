import { useEffect, useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ApiError, useApi } from '../lib/api';

type CheckResp = { available: boolean; reason?: string; self?: boolean };

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

const OnboardingPage: React.FC = () => {
  const { user } = useUser();
  const api = useApi();
  const history = useHistory();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(user?.firstName ?? '');
  const [check, setCheck] = useState<'idle' | 'checking' | 'ok' | 'taken' | 'invalid'>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (!u) return setCheck('idle');
    if (!USERNAME_RE.test(u)) return setCheck('invalid');
    setCheck('checking');
    const t = setTimeout(async () => {
      try {
        const r = await api<CheckResp>(`/api/profile/check-username?u=${encodeURIComponent(u)}`);
        setCheck(r.available ? 'ok' : r.reason === 'invalid_format' ? 'invalid' : 'taken');
      } catch {
        setCheck('idle');
      }
    }, 350);
    return () => clearTimeout(t);
  }, [username, api]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (check !== 'ok' && check !== 'idle') {
      setError('Please pick a valid, available username.');
      return;
    }
    setSubmitting(true);
    try {
      await api('/api/profile', {
        method: 'POST',
        body: JSON.stringify({ username: username.trim().toLowerCase(), displayName }),
      });
      history.replace('/tabs/library');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setError('That username is taken.');
      else setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="ion-padding">
        <h2 style={{ marginTop: 8, fontWeight: 700 }}>Pick a username</h2>
        <IonText color="medium">
          <p style={{ marginTop: 0 }}>
            This is how friends will find you. You can change your display name anytime.
          </p>
        </IonText>

        <form onSubmit={onSubmit}>
          <IonList inset>
            <IonItem>
              <IonInput
                label="Username"
                labelPlacement="stacked"
                placeholder="e.g. arcade_kira"
                value={username}
                onIonInput={(e) => setUsername(String(e.detail.value ?? ''))}
                autocapitalize="off"
                autocorrect="off"
                spellcheck={false}
                clearInput
              />
            </IonItem>
            <IonItem>
              <IonInput
                label="Display name"
                labelPlacement="stacked"
                placeholder="Optional"
                value={displayName}
                onIonInput={(e) => setDisplayName(String(e.detail.value ?? ''))}
              />
            </IonItem>
          </IonList>

          <IonNote color={check === 'taken' || check === 'invalid' ? 'danger' : 'medium'} style={{ display: 'block', padding: '0 24px' }}>
            {check === 'checking' && <><IonSpinner name="dots" style={{ height: 12 }} /> Checking…</>}
            {check === 'ok' && '✓ Available'}
            {check === 'taken' && 'Already taken'}
            {check === 'invalid' && '3-20 characters: lowercase letters, numbers, underscore'}
            {check === 'idle' && username === '' && '3-20 characters: lowercase letters, numbers, underscore'}
          </IonNote>

          {error && (
            <IonText color="danger">
              <p style={{ padding: '0 24px' }}>{error}</p>
            </IonText>
          )}

          <div style={{ padding: '24px 16px 0' }}>
            <IonButton expand="block" type="submit" disabled={submitting || check !== 'ok'}>
              {submitting ? <IonSpinner name="dots" /> : 'Continue'}
            </IonButton>
          </div>
        </form>
      </IonContent>
    </IonPage>
  );
};

export default OnboardingPage;
