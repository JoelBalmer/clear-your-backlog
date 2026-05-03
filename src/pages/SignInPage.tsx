import { IonContent, IonPage } from '@ionic/react';
import { SignIn } from '@clerk/clerk-react';
import './AuthPage.css';

const SignInPage: React.FC = () => (
  <IonPage>
    <IonContent fullscreen>
      <div className="auth-page">
        <div className="auth-page__brand">
          <h1>Clear Your Backlog</h1>
          <p>Rate, rank, and share the games you actually play.</p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/tabs/library"
          fallbackRedirectUrl="/tabs/library"
          appearance={{ elements: { footer: { display: 'none' } } }}
        />
      </div>
    </IonContent>
  </IonPage>
);

export default SignInPage;
