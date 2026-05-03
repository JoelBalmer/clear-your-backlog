import { Redirect } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useMe } from '../contexts/MeContext';
import AppLoading from './AppLoading';

const RequireOnboarded: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded } = useAuth();
  const { status } = useMe();

  if (!isLoaded || status === 'loading') return <AppLoading />;
  if (status === 'no-profile') return <Redirect to="/onboarding" />;
  return <>{children}</>;
};

export default RequireOnboarded;
