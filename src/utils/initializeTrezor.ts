import TrezorConnect from '@trezor/connect-web';

import { ITrezorMetaData } from '../types';

let initPromise: Promise<void> | null = null;

/**
 * Trezor Connect requires a manifest (app name, url and contact email) before
 * it can be used, so it is only initialized when the dApp provides the
 * `trezor` property in its Blux config.
 */
export const initializeTrezor = (
  trezor: ITrezorMetaData,
  appName: string,
): Promise<void> => {
  if (initPromise) {
    return initPromise;
  }

  initPromise = TrezorConnect.init({
    manifest: {
      appName,
      appUrl: trezor.appUrl || window.location.origin,
      email: trezor.email,
    },
    lazyLoad: true,
  }).catch(() => {
    initPromise = null;
  }) as Promise<void>;

  return initPromise;
};

export const waitForTrezor = async (): Promise<void> => {
  if (!initPromise) {
    throw new Error(
      'BLUX: Trezor is not set up. Please check your store configuration.',
    );
  }

  await initPromise;
};
