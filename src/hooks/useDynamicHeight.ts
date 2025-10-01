import { useEffect, useState } from 'react';

export const useDynamicHeight = (
  ref: React.RefObject<HTMLDivElement | null>,
  deps: React.DependencyList = [],
) => {
  const [height, setHeight] = useState<number | string>('auto');
  const [isHeightReady, setIsHeightReady] = useState(false);
  const [resetToggle, setResetToggle] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let cancelled = false;

    const measure = () => {
      if (cancelled) return;
      if (!el.offsetParent) return;
      setHeight(el.offsetHeight);
      setIsHeightReady(true);
    };

    // find images inside the container
    const imgs = Array.from(el.getElementsByTagName('img'));
    const pending = imgs.filter(
      (img) => !(img.complete && img.naturalHeight > 0),
    );

    if (pending.length === 0) {
      requestAnimationFrame(() => requestAnimationFrame(measure));
    } else {
      // wait for all images to load
      let remaining = pending.length;
      const onImgDone = () => {
        remaining -= 1;
        if (remaining === 0) {
          requestAnimationFrame(() => requestAnimationFrame(measure));
        }
      };
      pending.forEach((img) => {
        img.addEventListener('load', onImgDone);
        img.addEventListener('error', onImgDone);
      });
      return () => {
        cancelled = true;
        pending.forEach((img) => {
          img.removeEventListener('load', onImgDone);
          img.removeEventListener('error', onImgDone);
        });
      };
    }
  }, [...deps, resetToggle]);

  const reset = () => {
    setIsHeightReady(false);
    setHeight('auto');
    setResetToggle((prev) => !prev);
  };

  return { height, isHeightReady, reset };
};
