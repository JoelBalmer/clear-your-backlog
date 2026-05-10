import { useEffect, useRef } from 'react';

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 12;

/**
 * Long-press detection using touch events (reliable on iOS in scrollable lists)
 * with mouse event fallback for desktop.
 *
 * Pointer events are intentionally avoided: on iOS, IonContent's scroll
 * detection fires pointercancel within ~200ms, killing the long-press timer
 * before it fires. Touch events let us independently track the gesture without
 * the browser hijacking it for scrolling.
 */
export function useLongPress(
  ref: React.RefObject<HTMLElement>,
  callback: () => void,
  enabled = true,
) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;

    const fire = () => {
      timer = null;
      cbRef.current();
    };

    const cancel = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    // ── Touch (mobile) ──────────────────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      if (!enabled) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      timer = setTimeout(fire, LONG_PRESS_MS);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!timer) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) cancel();
    };

    // ── Mouse (desktop) ─────────────────────────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (!enabled || e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      timer = setTimeout(fire, LONG_PRESS_MS);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!timer) return;
      if (Math.abs(e.clientX - startX) > MOVE_THRESHOLD || Math.abs(e.clientY - startY) > MOVE_THRESHOLD) cancel();
    };

    const onCtx = (e: Event) => { if (timer) e.preventDefault(); };

    el.addEventListener('touchstart',  onTouchStart,  { passive: true });
    el.addEventListener('touchend',    cancel,         { passive: true });
    el.addEventListener('touchcancel', cancel,         { passive: true });
    el.addEventListener('touchmove',   onTouchMove,    { passive: true });
    el.addEventListener('mousedown',   onMouseDown);
    el.addEventListener('mouseup',     cancel);
    el.addEventListener('mouseleave',  cancel);
    el.addEventListener('mousemove',   onMouseMove);
    el.addEventListener('contextmenu', onCtx);

    return () => {
      el.removeEventListener('touchstart',  onTouchStart);
      el.removeEventListener('touchend',    cancel);
      el.removeEventListener('touchcancel', cancel);
      el.removeEventListener('touchmove',   onTouchMove);
      el.removeEventListener('mousedown',   onMouseDown);
      el.removeEventListener('mouseup',     cancel);
      el.removeEventListener('mouseleave',  cancel);
      el.removeEventListener('mousemove',   onMouseMove);
      el.removeEventListener('contextmenu', onCtx);
    };
  }, [ref, enabled]);
}
