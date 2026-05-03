import { IonButton, IonIcon } from '@ionic/react';
import { moonOutline, sparklesOutline, sunnyOutline } from 'ionicons/icons';
import { useTheme } from '../contexts/ThemeContext';
import { tap as hapticTap } from '../lib/haptics';

const ICONS: Record<string, string> = {
  dark: moonOutline,
  light: sunnyOutline,
  synthwave: sparklesOutline,
  system: moonOutline,
};

const ThemeButton: React.FC = () => {
  const { resolved, cycle } = useTheme();
  return (
    <IonButton
      fill="clear"
      onClick={() => {
        hapticTap();
        cycle();
      }}
      aria-label={`Theme: ${resolved}. Tap to cycle.`}
    >
      <IonIcon icon={ICONS[resolved] ?? moonOutline} slot="icon-only" />
    </IonButton>
  );
};

export default ThemeButton;
