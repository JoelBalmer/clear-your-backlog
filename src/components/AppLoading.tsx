import { IonContent, IonPage, IonSpinner } from '@ionic/react';

const AppLoading: React.FC = () => (
  <IonPage>
    <IonContent fullscreen>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <IonSpinner name="crescent" />
      </div>
    </IonContent>
  </IonPage>
);

export default AppLoading;
