import { IonContent, IonPage } from '@ionic/react';
import { SignIn } from '@clerk/clerk-react';
import BrandMark from '../components/BrandMark';
import './AuthPage.css';

const SignInPage: React.FC = () => (
  <IonPage>
    <IonContent fullscreen>
      <div className="auth-page">
        <div className="auth-page__brand">
          <BrandMark size={56} showWordmark />
          <h1>Clear Your Backlog</h1>
          <p>Rate, rank, and share the games you actually play.</p>
        </div>
        <SignIn
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
          forceRedirectUrl="/tabs/library"
          fallbackRedirectUrl="/tabs/library"
        />
        <div className="auth-page__footer">
          By continuing you agree to our
          <a href="/terms">Terms</a>·<a href="/privacy">Privacy</a>
        </div>
      </div>
    </IonContent>
  </IonPage>
);

export default SignInPage;
