import { _login } from './exports/blux';
import { preloadLogos } from './utils/preloadImages';
import { preloadAssetMeta } from './utils/preloadAssetMeta';
import { scrubStoredBearerTokens } from './utils/checkRecentLogins';
import { isAppValid, waitForBluxReady } from './utils/appValidity';

import './tailwind.css';

export * from './exports';
export { createConfig } from './exports/createConfig';

preloadLogos();
preloadAssetMeta();
scrubStoredBearerTokens();

(async () => {
  await waitForBluxReady();

  // Never auto-restore a session when the appId is invalid — Blux is disabled.
  if (!isAppValid()) {
    return;
  }

  _login(true);
})();
