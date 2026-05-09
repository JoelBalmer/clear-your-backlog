import { useEffect, useRef } from 'react';

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 10;

/**
 * Attaches native pointer listeners directly to a DOM ref so the long-press
 * fires reliably even when the element uses Ionic's shadow DOM (where React
 * synthetic events don't propagate correctly).
 */
export function useLongPress(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  enabled = true,
) {
  // Keep callback current without re-running the effect on every render.
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;

    const onDown = (e: PointerEvent) => {
      if (!enabled) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      timer = setTimeout(() => {
        timer = null;
        cbRef.current();
      }, LONG_PRESS_MS);
    };

    const onCancel = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    const onMove = (e: PointerEvent) => {
      if (
        Math.abs(e.clientX - startX) > MOVE_THRESHOLD ||
        Math.abs(e.clientY - startY) > MOVE_THRESHOLD
      ) {
        onCancel();
      }
    };

    const onCtx = (e: Event) => e.preventDefault();

    el.addEventListener('pointerdown', onDown);
    el.addEventListener('pointerup', onCancel);
    el.addEventListener('pointercancel', onCancel);
    el.addEventListener('pointerleave', onCancel);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('contextmenu', onCtx);

    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('pointerup', onCancel);
      el.removeEventListener('pointercancel', onCancel);
      el.removeEventListener('pointerleave', onCancel);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('contextmenu', onCtx);
    };
  }, [ref, enabled]);
}
