import { useMemo } from 'react';

import CDNFiles from '../constants/cdnFiles';
import { BLUX_CDN_PATH } from '../constants/consts';
import { ILogo as ILogo, useAppStore } from '../store';

type ImageProps = {
  name: CDNFiles;
  className?: string;
  props?: Record<string, string>;
};

const CDNImage = ({ className, name, props = {}, ...rest }: ImageProps) => {
  const logos = useAppStore((state) => state.logos);

  const logo = useMemo(
    () => logos?.find((l: ILogo) => l.name === name),
    [logos, name],
  );

  // Serialize props to a stable string so the memo below only recomputes when
  // the actual values change — not on every render (the inline `props={{...}}`
  // passed by callers is a new object reference each render).
  const propsKey = JSON.stringify(props);

  const svgContent = useMemo(() => {
    if (!logo) return '';

    let processedContent = logo.content;

    const valueMap = new Map<string, string>();

    const defaultValues = logo.default_values || [];

    defaultValues.forEach(({ name, value }) => {
      valueMap.set(name, value);
    });

    Object.entries(props).forEach(([key, value]) => {
      valueMap.set(key, value);
    });

    valueMap.forEach((value, key) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processedContent = processedContent.replace(regex, value);
    });

    return processedContent;
    // `props` is intentionally tracked via the stable `propsKey` string.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo, propsKey]);

  if (!logos || !logo) {
    const url = `${BLUX_CDN_PATH}/${encodeURIComponent(name)}`;

    const qs = Object.entries(props)
      .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
      .join('&');

    const src = `${url}?${qs}`;

    return <img src={src} alt={name} />;
  }

  if (!svgContent) {
    return (
      <div
        style={{
          width: 50,
          height: 50,
          background: 'transparent',
          objectFit: 'contain',
        }}
      />
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: svgContent }}
      {...rest}
      className={className}
    />
  );
};

export default CDNImage;
