import { IonContent, IonPage } from '@ionic/react';
import { SignUp } from '@clerk/clerk-react';
import BrandMark from '../components/BrandMark';
import './AuthPage.css';

const SignUpPage: React.FC = () => (
  <IonPage>
    <IonContent fullscreen>
      <div className="auth-page">
        <div className="auth-page__brand">
          <BrandMark size={56} showWordmark />
          <h1>Clear Your Backlog</h1>
          <p>Build your game library and follow what your friends are playing.</p>
        </div>
        <SignUp
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
          forceRedirectUrl="/onboarding"
          fallbackRedirectUrl="/onboarding"
        />
        <div className="auth-page__footer">
          By continuing you agree to our
          <a href="/terms">Terms</a>·<a href="/privacy">Privacy</a>
        </div>
      </div>
    </IonContent>
  </IonPage>
);

export default SignUpPage;
