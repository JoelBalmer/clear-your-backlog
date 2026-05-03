import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useApi } from '../lib/api';
import type { Profile } from '../types/models';

type MeResponse = { profile: Profile | null; needsOnboarding: boolean };

type MeState = {
  status: 'loading' | 'no-profile' | 'ready' | 'error';
  profile: Profile | null;
  error: string | null;
  reload: () => Promise<void>;
};

const MeContext = createContext<MeState | null>(null);

export const MeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  const api = useApi();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [status, setStatus] = useState<MeState['status']>('loading');
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;
    setStatus('loading');
    setError(null);
    try {
      const r = await api<MeResponse>('/api/me');
      if (r.needsOnboarding || !r.profile) {
        setProfile(null);
        setStatus('no-profile');
      } else {
        setProfile(r.profile);
        setStatus('ready');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      setStatus('error');
    }
  }, [api, isLoaded, isSignedIn]);

  useEffect(() => {
    if (isLoaded && isSignedIn) reload();
    else if (isLoaded && !isSignedIn) {
      setProfile(null);
      setStatus('no-profile');
    }
  }, [isLoaded, isSignedIn, reload]);

  return (
    <MeContext.Provider value={{ status, profile, error, reload }}>{children}</MeContext.Provider>
  );
};

export function useMe(): MeState {
  const ctx = useContext(MeContext);
  if (!ctx) throw new Error('useMe must be used inside <MeProvider>');
  return ctx;
}
