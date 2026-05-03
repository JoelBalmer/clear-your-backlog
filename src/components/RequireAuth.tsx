import { useAuth } from '@clerk/clerk-react';
import { Redirect } from 'react-router-dom';
import AppLoading from './AppLoading';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AppLoading />;
  if (!isSignedIn) return <Redirect to="/sign-in" />;
  return <>{children}</>;
};

export default RequireAuth;
