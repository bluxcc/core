import { useEffect, useState } from 'react';

export const useIsMobile = (breakpoint = 460) => {
  // Seeded from the real viewport so the first paint on a phone doesn't flash
  // the desktop (centered) modal before switching to the bottom sheet.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  );

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();

    window.addEventListener('resize', update);

    return () => window.removeEventListener('resize', update);
  }, [breakpoint]);

  return isMobile;
};
