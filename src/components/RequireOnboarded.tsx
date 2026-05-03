import { useEffect, useState } from 'react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../lib/api';
import type { Profile } from '../lib/db/schema';
import AppLoading from './AppLoading';

type MeResponse = { profile: Profile | null; needsOnboarding: boolean };

const RequireOnboarded: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [state, setState] = useState<'loading' | 'ok' | 'needs-onboarding'>('loading');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    api<MeResponse>('/api/me')
      .then((r) => {
        if (cancelled) return;
        setState(r.needsOnboarding ? 'needs-onboarding' : 'ok');
      })
      .catch(() => {
        if (!cancelled) setState('needs-onboarding');
      });
    return () => {
      cancelled = true;
    };
  }, [api, isLoaded, isSignedIn]);

  if (!isLoaded || state === 'loading') return <AppLoading />;
  if (state === 'needs-onboarding') return <Redirect to="/onboarding" />;
  return <>{children}</>;
};

export default RequireOnboarded;
