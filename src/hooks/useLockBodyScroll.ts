import { useEffect } from 'react';

export function useLockBodyScroll(lock: boolean, element: HTMLElement) {
  useEffect(() => {
    if (!lock) return;

    const previousOverflow = element.style.overflow;

    element.style.overflow = 'hidden';

    return () => {
      element.style.overflow = previousOverflow;
    };
  }, [lock, element]);
}
