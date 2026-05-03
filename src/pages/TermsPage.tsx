import { useHistory } from 'react-router-dom';
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

const TermsPage: React.FC = () => {
  const history = useHistory();
  const defaultHref = history.length > 1 ? undefined : '/';
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={defaultHref ?? '/'} />
          </IonButtons>
          <IonTitle>Terms</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <article className="page-narrow legal-doc">
          <h1>Terms of Use</h1>
          <p>
            <em>Last updated: 2026-05-03</em>
          </p>

          <h2>About</h2>
          <p>
            Clear Your Backlog (the "Service") is a personal/portfolio project for tracking and
            sharing video game ratings. It is provided free of charge, as-is, with no service-level
            guarantees.
          </p>

          <h2>Acceptable use</h2>
          <ul>
            <li>Don't impersonate other users.</li>
            <li>Don't post game ratings or notes containing illegal content, harassment, or spam.</li>
            <li>Don't try to break, scrape, or overload the Service. Rate limits are enforced.</li>
            <li>Don't use the Service to circumvent IGDB's or Twitch's terms of service.</li>
          </ul>

          <h2>Your content</h2>
          <p>
            You retain ownership of the ratings, notes, and tags you create. By posting them you
            grant the Service permission to store them and display them on your profile (which is
            public by default — see the <a href="/privacy">Privacy Policy</a>).
          </p>

          <h2>Termination</h2>
          <p>
            You can delete your account at any time from Profile → Account → Delete account. We may
            suspend or delete accounts that violate the acceptable use rules above.
          </p>

          <h2>Disclaimer</h2>
          <p>
            The Service is provided "as is", without warranty of any kind. The maintainers are not
            liable for any loss or damage arising from use or unavailability of the Service.
          </p>

          <h2>Game data</h2>
          <p>
            Game metadata (titles, covers, summaries, release dates) comes from{' '}
            <a href="https://www.igdb.com" target="_blank" rel="noopener noreferrer">
              IGDB
            </a>
            , owned by Twitch Interactive. All game-related trademarks remain the property of their
            respective publishers.
          </p>

          <h2>Changes</h2>
          <p>
            These terms can change without notice. Material changes will be reflected in the "Last
            updated" date.
          </p>
        </article>
      </IonContent>
    </IonPage>
  );
};

export default TermsPage;
