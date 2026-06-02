import { _login } from './exports/blux';
import { getState } from './store';
import { timeout } from './utils/helpers';
import { preloadLogos } from './utils/preloadImages';

export * from './exports';
export { createConfig } from './exports/createConfig';

preloadLogos();

(async () => {
  while (true) {
    const s = getState();

    if (s.authState.isReady) break;

    await timeout(50);
  }

  _login(true);
})();
