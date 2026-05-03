import { Redirect, Route, Switch } from 'react-router-dom';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { MeProvider } from './contexts/MeContext';
import RequireAuth from './components/RequireAuth';
import AppLoading from './components/AppLoading';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import OnboardingPage from './pages/OnboardingPage';
import Tabs from './pages/Tabs';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* Theme */
import '@ionic/react/css/palettes/dark.system.css';
import './theme/variables.css';
import './theme/app.css';

setupIonicReact();

const RootRedirect: React.FC = () => {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <AppLoading />;
  return <Redirect to={isSignedIn ? '/tabs/library' : '/sign-in'} />;
};

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <MeProvider>
      <IonRouterOutlet>
        <Switch>
          <Route path="/sign-in">
            <SignedOut>
              <SignInPage />
            </SignedOut>
            <SignedIn>
              <Redirect to="/tabs/library" />
            </SignedIn>
          </Route>
          <Route path="/sign-up">
            <SignedOut>
              <SignUpPage />
            </SignedOut>
            <SignedIn>
              <Redirect to="/onboarding" />
            </SignedIn>
          </Route>
          <Route path="/onboarding">
            <RequireAuth>
              <OnboardingPage />
            </RequireAuth>
          </Route>
          <Route path="/tabs">
            <RequireAuth>
              <Tabs />
            </RequireAuth>
          </Route>
          <Route exact path="/">
            <RootRedirect />
          </Route>
          <Route>
            <RootRedirect />
          </Route>
        </Switch>
      </IonRouterOutlet>
      </MeProvider>
    </IonReactRouter>
  </IonApp>
);

export default App;
