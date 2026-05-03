import { IonIcon } from '@ionic/react';
import { star, starHalf, starOutline } from 'ionicons/icons';

type Props = {
  value: number | null; // 0.5 .. 10
  size?: number; // pixel size
  onChange?: (next: number) => void;
};

const StarRating: React.FC<Props> = ({ value, size = 18, onChange }) => {
  const interactive = !!onChange;
  const stars: React.ReactNode[] = [];
  // Show 5 stars, each star = 2 rating points (so 10 total)
  for (let i = 0; i < 5; i++) {
    const slot = i * 2 + 1; // 1, 3, 5, 7, 9
    const v = value ?? 0;
    let icon = starOutline;
    if (v >= slot + 1) icon = star;
    else if (v >= slot) icon = starHalf;

    stars.push(
      <span
        key={i}
        style={{ display: 'inline-flex', cursor: interactive ? 'pointer' : 'default' }}
        onClick={
          interactive
            ? (e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                const isLeftHalf = e.clientX - rect.left < rect.width / 2;
                onChange(isLeftHalf ? slot : slot + 1);
              }
            : undefined
        }
      >
        <IonIcon
          icon={icon}
          style={{ fontSize: size, color: 'var(--ion-color-warning, #f1c40f)' }}
        />
      </span>,
    );
  }
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {stars}
      {value != null && (
        <span
          style={{
            marginLeft: 6,
            fontSize: Math.max(11, size - 6),
            color: 'var(--ion-color-medium)',
            fontWeight: 600,
          }}
        >
          {value.toFixed(1)}
        </span>
      )}
    </span>
  );
};

export default StarRating;
