// Thin wrapper around @capacitor/haptics with a graceful no-op on web where
// the plugin returns rejected promises. Keep call sites trivial:
//   import { tap, success, error } from '../lib/haptics';
//   tap();

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

function safe(fn: () => Promise<unknown>): void {
  try {
    fn().catch(() => {});
  } catch {
    /* swallow — web may not support haptics */
  }
}

export function tap(): void {
  safe(() => Haptics.impact({ style: ImpactStyle.Light }));
}

export function bump(): void {
  safe(() => Haptics.impact({ style: ImpactStyle.Medium }));
}

export function success(): void {
  safe(() => Haptics.notification({ type: NotificationType.Success }));
}

export function warning(): void {
  safe(() => Haptics.notification({ type: NotificationType.Warning }));
}

export function error(): void {
  safe(() => Haptics.notification({ type: NotificationType.Error }));
}
