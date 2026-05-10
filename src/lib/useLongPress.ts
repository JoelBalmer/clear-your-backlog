import { useEffect, useRef } from 'react';

const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 12;

/**
 * Long-press detection using document-level listeners + bounding-box hit
 * testing. Element-level listeners are unreliable for Ionic components because
 * touch events don't always re-target correctly when exiting Stencil's shadow
 * DOM. Attaching to document and checking getBoundingClientRect() sidesteps
 * all shadow DOM event propagation issues entirely.
 */
export function useLongPress(
  ref: React.RefObject<HTMLElement | null>,
  callback: () => void,
  enabled = true,
) {
  const cbRef = useRef(callback);
  useEffect(() => { cbRef.current = callback; });

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;

    const fire = () => { timer = null; cbRef.current(); };
    const cancel = () => { if (timer) { clearTimeout(timer); timer = null; } };

    const inBounds = (x: number, y: number) => {
      const r = el.getBoundingClientRect();
      return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    };

    // ── Touch (mobile) ─────────────────────────────────────────────────────────────────────────────────────
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!inBounds(t.clientX, t.clientY)) return;
      startX = t.clientX;
      startY = t.clientY;
      timer = setTimeout(fire, LONG_PRESS_MS);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!timer) return;
      const t = e.changedTouches[0];
      if (Math.abs(t.clientX - startX) > MOVE_THRESHOLD ||
          Math.abs(t.clientY - startY) > MOVE_THRESHOLD) cancel();
    };

    // ── Mouse (desktop) ──────────────────────────────────────────────────────────────────────────────────────
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || !inBounds(e.clientX, e.clientY)) return;
      startX = e.clientX;
      startY = e.clientY;
      timer = setTimeout(fire, LONG_PRESS_MS);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!timer) return;
      if (Math.abs(e.clientX - startX) > MOVE_THRESHOLD ||
          Math.abs(e.clientY - startY) > MOVE_THRESHOLD) cancel();
    };

    document.addEventListener('touchstart',  onTouchStart, { passive: true });
    document.addEventListener('touchend',    cancel,        { passive: true });
    document.addEventListener('touchcancel', cancel,        { passive: true });
    document.addEventListener('touchmove',   onTouchMove,   { passive: true });
    document.addEventListener('mousedown',   onMouseDown);
    document.addEventListener('mouseup',     cancel);
    document.addEventListener('mousemove',   onMouseMove);

    return () => {
      document.removeEventListener('touchstart',  onTouchStart);
      document.removeEventListener('touchend',    cancel);
      document.removeEventListener('touchcancel', cancel);
      document.removeEventListener('touchmove',   onTouchMove);
      document.removeEventListener('mousedown',   onMouseDown);
      document.removeEventListener('mouseup',     cancel);
      document.removeEventListener('mousemove',   onMouseMove);
    };
  }, [ref, enabled]);
}
