import { lazy, Suspense } from 'react';
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

const PublicProfile = lazy(() => import('./pages/PublicProfile'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

function lazyRoute(Component: React.ComponentType) {
  const Wrapped: React.FC = () => (
    <Suspense fallback={<AppLoading />}>
      <Component />
    </Suspense>
  );
  return Wrapped;
}

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

/* Theme — class palette so dark mode is controlled by ThemeContext, not the OS */
import '@ionic/react/css/palettes/dark.class.css';
import './theme/brand.css';
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
          {/* Top-level (no auth required) */}
          <Route path="/u/:username" component={lazyRoute(PublicProfile)} />
          <Route path="/privacy" component={lazyRoute(PrivacyPage)} />
          <Route path="/terms" component={lazyRoute(TermsPage)} />
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
