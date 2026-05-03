import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';

type Props = {
  title: string;
  icon: string;
  headline: string;
  body: string;
};

const PlaceholderPage: React.FC<Props> = ({ title, icon, headline, body }) => (
  <IonPage>
    <IonHeader>
      <IonToolbar>
        <IonTitle>{title}</IonTitle>
      </IonToolbar>
    </IonHeader>
    <IonContent fullscreen>
      <IonHeader collapse="condense">
        <IonToolbar>
          <IonTitle size="large">{title}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <div className="empty-state">
        <div className="empty-state__icon">
          <IonIcon icon={icon} />
        </div>
        <h2>{headline}</h2>
        <IonText color="medium">
          <p>{body}</p>
        </IonText>
      </div>
    </IonContent>
  </IonPage>
);

export default PlaceholderPage;
