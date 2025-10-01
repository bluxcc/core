import { useEffect, useState } from 'react';

export const useIsMobile = (breakpoint = 460) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint);
    update();

    window.addEventListener('resize', update);

    return () => window.removeEventListener('resize', update);
  }, [breakpoint]);

  return isMobile;
};
