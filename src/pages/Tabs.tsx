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
import Library from './Library';
import Discover from './Discover';
import Friends from './Friends';
import Profile from './Profile';
import GameDetail from './GameDetail';
import PublicProfile from './PublicProfile';

const Tabs: React.FC = () => (
  <RequireOnboarded>
    <IonTabs>
      <IonRouterOutlet>
        <Route exact path="/tabs/library" component={Library} />
        <Route exact path="/tabs/library/g/:igdbId" component={GameDetail} />
        <Route exact path="/tabs/discover" component={Discover} />
        <Route exact path="/tabs/friends" component={Friends} />
        <Route exact path="/tabs/profile" component={Profile} />
        <Route exact path="/tabs/u/:username" component={PublicProfile} />
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
