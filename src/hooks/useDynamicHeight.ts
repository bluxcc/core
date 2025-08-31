import { RefObject } from "preact";
import { useEffect, useState } from "preact/hooks";

export const useDynamicHeight = (
  ref: RefObject<HTMLDivElement | null>,
  deps: any[] = []
) => {
  const [height, setHeight] = useState<string | number>("auto");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const updateHeight = () => {
      setHeight(el.offsetHeight);
    };

    updateHeight();
    setReady(true);

    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => observer.disconnect();
  }, deps);

  return { height, ready };
};
