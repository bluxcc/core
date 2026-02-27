import { CDNPreloadImages } from '../enums';
import { BLUX_CDN_PATH } from '../constants/consts';

const preloadImages = () => {
  const o = Object.entries(CDNPreloadImages).map(
    (x) => `${BLUX_CDN_PATH}/${x[1]}`,
  );

  for (const url of o) {
    const img = new Image();

    img.src = url;
  }
};

export default preloadImages;
