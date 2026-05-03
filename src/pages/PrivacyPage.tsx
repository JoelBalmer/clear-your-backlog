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

const PrivacyPage: React.FC = () => {
  const history = useHistory();
  // If we got here via direct URL, the back button has nothing to pop. Fallback to "/" home.
  const defaultHref = history.length > 1 ? undefined : '/';
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref={defaultHref ?? '/'} />
          </IonButtons>
          <IonTitle>Privacy</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <article className="page-narrow legal-doc">
          <h1>Privacy Policy</h1>
          <p>
            <em>Last updated: 2026-05-03</em>
          </p>

          <h2>What we collect</h2>
          <ul>
            <li>
              <strong>Account info</strong> — your email address, the username and (optional)
              display name you chose during onboarding. Email and authentication are handled by{' '}
              <a href="https://clerk.com/privacy" target="_blank" rel="noopener noreferrer">
                Clerk
              </a>
              .
            </li>
            <li>
              <strong>Your library</strong> — every game you add, your rating, status, notes, tags,
              and play date. Stored on{' '}
              <a href="https://neon.tech/privacy-policy" target="_blank" rel="noopener noreferrer">
                Neon
              </a>{' '}
              (Postgres).
            </li>
            <li>
              <strong>Your social graph</strong> — who you follow and who follows you.
            </li>
            <li>
              <strong>Game metadata</strong> — covers, summaries, platforms come from{' '}
              <a href="https://www.igdb.com/api" target="_blank" rel="noopener noreferrer">
                IGDB
              </a>{' '}
              (owned by Twitch). Cached on our database to avoid re-fetching.
            </li>
          </ul>

          <h2>What we don't collect</h2>
          <ul>
            <li>No analytics, no third-party trackers, no advertising pixels.</li>
            <li>No payment info — the app is free.</li>
            <li>No location data.</li>
          </ul>

          <h2>Who can see your data</h2>
          <ul>
            <li>
              <strong>Public:</strong> your username, display name, follower/following counts, and
              your library (games + ratings + statuses) are visible to anyone with your profile
              link.
            </li>
            <li>
              <strong>Private:</strong> your email, and any notes you attach to games.
            </li>
          </ul>

          <h2>Deleting your data</h2>
          <p>
            Profile → Account → Delete account. This permanently removes your profile, library,
            tags, and social graph from our database, and deletes your Clerk authentication
            record. Cached game metadata (covers, summaries) is anonymous and not tied to your
            account.
          </p>

          <h2>Email</h2>
          <p>
            If you opt in to the weekly digest (off by default), we use your email address to send
            one summary per week. Unsubscribe anytime from Profile → Email preferences.
          </p>

          <h2>Contact</h2>
          <p>
            This is a personal/portfolio project. Reach out via the GitHub issues page on the{' '}
            <a
              href="https://github.com/FikretHassan/clear-your-backlog"
              target="_blank"
              rel="noopener noreferrer"
            >
              repo
            </a>
            .
          </p>
        </article>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPage;
