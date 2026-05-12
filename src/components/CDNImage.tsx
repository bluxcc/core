import { useEffect, useMemo, useState } from 'react';

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

  const [svgContent, setSvgContent] = useState<string>('');

  const logo = useMemo(
    () => logos?.find((l: ILogo) => l.name === name),
    [logos, name],
  );

  if (!logos || !logo) {
    const url = `${BLUX_CDN_PATH}/${encodeURIComponent(name)}`;

    const qs = Object.entries(props)
      .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
      .join('&');

    const src = `${url}?${qs}`;

    return <img src={src} alt={name} />;
  }

  useEffect(() => {
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

    setSvgContent(processedContent);
  }, [logo, props]);

  if (!svgContent) {
    return <div style={{ width: 50, height: 50, background: '#f0f0f0' }} />;
  }

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svgContent }}
      {...rest}
    />
  );
};

export default CDNImage;
