import CDNFiles from '../constants/cdnFiles';

type ImageProps = {
  name: CDNFiles;
  props?: Record<string, string>;
};

const BLUX_CDN_PATH = 'https://cdn.blux.cc/files';

const CDNImage = ({ name, props = {} }: ImageProps) => {
  const url = `${BLUX_CDN_PATH}/${encodeURIComponent(name)}`;

  const qs = Object.entries(props)
    .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
    .join('&');

  const src = `${url}?${qs}`;

  return <img src={src} alt={name} />;
};

export default CDNImage;
