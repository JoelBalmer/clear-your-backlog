import { useCallback, useRef } from 'react';

const LONG_PRESS_MS = 500;

export function useLongPress(callback: () => void, enabled = true) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moved = useRef(false);

  const start = useCallback(
    (e: React.PointerEvent) => {
      if (!enabled) return;
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      moved.current = false;
      timer.current = setTimeout(() => {
        if (!moved.current) callback();
      }, LONG_PRESS_MS);
    },
    [callback, enabled],
  );

  const cancel = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  return {
    onPointerDown: start,
    onPointerUp: cancel,
    onPointerLeave: cancel,
    onPointerMove: () => {
      moved.current = true;
      cancel();
    },
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  };
}
