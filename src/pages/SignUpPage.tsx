import { IonContent, IonPage } from '@ionic/react';
import { SignUp } from '@clerk/clerk-react';
import './AuthPage.css';

const SignUpPage: React.FC = () => (
  <IonPage>
    <IonContent fullscreen>
      <div className="auth-page">
        <div className="auth-page__brand">
          <h1>Clear Your Backlog</h1>
          <p>Build your game library and follow what your friends are playing.</p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
          fallbackRedirectUrl="/onboarding"
          appearance={{ elements: { footer: { display: 'none' } } }}
        />
      </div>
    </IonContent>
  </IonPage>
);

export default SignUpPage;
