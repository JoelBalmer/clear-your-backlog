import { lazy, Suspense } from 'react';
import { Redirect, Route } from 'react-router-dom';
import {
  IonIcon,
  IonLabel,
  IonRouterOutlet,
  IonTabBar,
  IonTabButton,
  IonTabs,
} from '@ionic/react';
import {
  compassOutline,
  libraryOutline,
  peopleOutline,
  personCircleOutline,
} from 'ionicons/icons';
import RequireOnboarded from '../components/RequireOnboarded';
import AppLoading from '../components/AppLoading';

// Lazy-load each tab + detail page so initial bundle stays small.
const Library = lazy(() => import('./Library'));
const Discover = lazy(() => import('./Discover'));
const Friends = lazy(() => import('./Friends'));
const Profile = lazy(() => import('./Profile'));
const GameDetail = lazy(() => import('./GameDetail'));

function lazyRoute(Component: React.ComponentType) {
  const Wrapped: React.FC = () => (
    <Suspense fallback={<AppLoading />}>
      <Component />
    </Suspense>
  );
  return Wrapped;
}

const Tabs: React.FC = () => (
  <RequireOnboarded>
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/library" component={lazyRoute(Library)} />
        <Route exact path="/tabs/library/g/:igdbId" component={lazyRoute(GameDetail)} />
        <Route exact path="/tabs/discover" component={lazyRoute(Discover)} />
        <Route exact path="/tabs/friends" component={lazyRoute(Friends)} />
        <Route exact path="/tabs/profile" component={lazyRoute(Profile)} />
        <Route exact path="/tabs">
          <Redirect to="/tabs/library" />
        </Route>
      </IonRouterOutlet>
      <IonTabBar slot="bottom">
        <IonTabButton tab="library" href="/tabs/library">
          <IonIcon icon={libraryOutline} />
          <IonLabel>Library</IonLabel>
        </IonTabButton>
        <IonTabButton tab="discover" href="/tabs/discover">
          <IonIcon icon={compassOutline} />
          <IonLabel>Discover</IonLabel>
        </IonTabButton>
        <IonTabButton tab="friends" href="/tabs/friends">
          <IonIcon icon={peopleOutline} />
          <IonLabel>Friends</IonLabel>
        </IonTabButton>
        <IonTabButton tab="profile" href="/tabs/profile">
          <IonIcon icon={personCircleOutline} />
          <IonLabel>Profile</IonLabel>
        </IonTabButton>
      </IonTabBar>
    </IonTabs>
  </RequireOnboarded>
);

export default Tabs;
