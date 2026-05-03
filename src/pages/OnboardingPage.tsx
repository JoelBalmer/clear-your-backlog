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
import { useMe } from '../contexts/MeContext';

type CheckResp = { available: boolean; reason?: string; self?: boolean };

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

type CheckState =
  | { status: 'idle' }
  | { status: 'too_short' }
  | { status: 'invalid' }
  | { status: 'checking' }
  | { status: 'ok' }
  | { status: 'taken' }
  | { status: 'error'; detail: string };

const OnboardingPage: React.FC = () => {
  const { user } = useUser();
  const api = useApi();
  const history = useHistory();
  const { reload: reloadMe } = useMe();

  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState(user?.firstName ?? '');
  const [check, setCheck] = useState<CheckState>({ status: 'idle' });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (!u) {
      setCheck({ status: 'idle' });
      return;
    }
    if (u.length < 3) {
      setCheck({ status: 'too_short' });
      return;
    }
    if (!USERNAME_RE.test(u)) {
      setCheck({ status: 'invalid' });
      return;
    }
    setCheck({ status: 'checking' });
    const t = setTimeout(async () => {
      try {
        const r = await api<CheckResp>(`/api/profile?check=${encodeURIComponent(u)}`);
        if (r.available) setCheck({ status: 'ok' });
        else if (r.reason === 'invalid_format') setCheck({ status: 'invalid' });
        else setCheck({ status: 'taken' });
      } catch (err) {
        const detail =
          err instanceof ApiError
            ? `HTTP ${err.status}${typeof err.body === 'object' && err.body && 'detail' in err.body ? `: ${(err.body as { detail: string }).detail}` : ''}`
            : err instanceof Error
              ? err.message
              : 'Unknown error';
        console.error('[onboarding] check-username failed:', err);
        setCheck({ status: 'error', detail });
      }
    }, 350);
    return () => clearTimeout(t);
  }, [username, api]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (check.status !== 'ok') return;
    setSubmitting(true);
    try {
      await api('/api/profile', {
        method: 'POST',
        body: JSON.stringify({
          username: username.trim().toLowerCase(),
          displayName: displayName.trim() || null,
        }),
      });
      await reloadMe();
      history.replace('/tabs/library');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setSubmitError('That username is taken.');
      else if (err instanceof ApiError)
        setSubmitError(`Failed (HTTP ${err.status}). Try again or sign out and back in.`);
      else setSubmitError('Network error. Try again.');
      setSubmitting(false);
    }
  };

  const noteForCheck = (): { color: 'medium' | 'success' | 'danger'; content: React.ReactNode } => {
    switch (check.status) {
      case 'idle':
        return { color: 'medium', content: '3-20 characters: lowercase letters, numbers, underscore' };
      case 'too_short':
        return { color: 'medium', content: `${username.length}/3 minimum characters` };
      case 'invalid':
        return { color: 'danger', content: 'Only lowercase letters, numbers, and underscore' };
      case 'checking':
        return {
          color: 'medium',
          content: (
            <>
              <IonSpinner name="dots" style={{ height: 12, verticalAlign: 'middle' }} /> Checking…
            </>
          ),
        };
      case 'ok':
        return { color: 'success', content: '✓ Available' };
      case 'taken':
        return { color: 'danger', content: 'Already taken' };
      case 'error':
        return { color: 'danger', content: `Couldn't verify: ${check.detail}` };
    }
  };

  const note = noteForCheck();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Welcome</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="page-narrow">
          <h2 style={{ marginTop: 8, fontWeight: 700 }}>Pick a username</h2>
          <IonText color="medium">
            <p style={{ marginTop: 0 }}>
              This is how friends will find you. Display name is what people see.
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
                  onIonInput={(e) =>
                    setUsername(
                      String(e.detail.value ?? '')
                        .toLowerCase()
                        .replace(/[^a-z0-9_]/g, ''),
                    )
                  }
                  maxlength={20}
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
                  maxlength={40}
                />
              </IonItem>
            </IonList>

            <IonNote color={note.color} style={{ display: 'block', padding: '8px 24px 0' }}>
              {note.content}
            </IonNote>

            {submitError && (
              <IonText color="danger">
                <p style={{ padding: '0 24px', margin: '8px 0 0' }}>{submitError}</p>
              </IonText>
            )}

            <div style={{ padding: '24px 16px 0' }}>
              <IonButton
                expand="block"
                type="submit"
                disabled={submitting || check.status !== 'ok'}
              >
                {submitting ? <IonSpinner name="dots" /> : 'Continue'}
              </IonButton>
            </div>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default OnboardingPage;
