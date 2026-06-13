import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Horizon, rpc } from '@stellar/stellar-sdk';

import { getState } from '../store';
import { authenticateAppId } from '../utils/api';
import { Provider } from '../components/Provider';
import { IConfig, IInternalConfig } from '../types';
import { defaultLightTheme } from '../constants/themes';
import { initializeTrezor } from '../utils/initializeTrezor';
import { initializeWalletConnect } from '../utils/initializeWalletConnect';
import { getEnabledSocials, isSocialProvider } from '../utils/socialLogin';
import {
  getNetworkRpc,
  handleLoadWallets,
  validateNetworkOptions,
  validateOrderWallets,
} from '../utils/helpers';

import '../tailwind.css';

let root: Root | null = null;
let isInitiated = false;
let container: HTMLDivElement | null = null;
let lastParentElement: HTMLElement | null = null;

const cleanUpBlux = () => {
  // should not be uncommented
  // if (root) {
  //   queueMicrotask(() => {
  //     try {
  //       if (root) {
  //         root.unmount();
  //
  //         root = null;
  //       }
  //     } catch { }
  //   });
  // }

  if (container && lastParentElement && lastParentElement.contains(container)) {
    lastParentElement.removeChild(container);
  }
};

const init = (element: HTMLElement = document.body) => {
  if (isInitiated) {
    cleanUpBlux();
  }

  lastParentElement = element;

  container = document.createElement('div');

  element.appendChild(container);

  root = createRoot(container);
  root.render(createElement(Provider));
};

export function createConfig(config: IConfig, element?: HTMLElement) {
  isInitiated = true;

  if (!config || Object.keys(config).length === 0) {
    throw new Error('BLUX: createConfig must take a config object');
  }

  if (!config.appId) {
    throw new Error(
      'BLUX: createConfig config object must have the appId property.',
    );
  }

  if (!config.appName) {
    throw new Error(
      'BLUX: createConfig config object must have the appName property.',
    );
  }

  if (!config.networks) {
    throw new Error(
      'BLUX: createConfig config object must have the networks property.',
    );
  }

  const SUPPORTED_LANGS = ['en', 'es', 'pt', 'fr', 'de', 'ru', 'zh', 'ja', 'ko'];
  let lang = (config.lang || 'en').trim().toLowerCase();

  if (!SUPPORTED_LANGS.includes(lang)) {
    console.warn(
      `BLUX: '${config.lang}' is not a supported language (${SUPPORTED_LANGS.join(', ')}). Falling back to English.`,
    );

    lang = 'en';
  }

  init(element);

  let excludeWallets = config.excludeWallets || ['lobstr'];

  // @ts-ignore
  excludeWallets = excludeWallets.map((x) => x.toLowerCase().replace(/\s+/g, ''));

  const orderWallets = validateOrderWallets(config.orderWallets);

  let promptOnWrongNetwork = true;

  if (config.promptOnWrongNetwork !== undefined) {
    promptOnWrongNetwork = config.promptOnWrongNetwork;
  }

  const conf: IInternalConfig = {
    ...config,
    excludeWallets,
    orderWallets,
    appearance: {
      ...defaultLightTheme,
      ...config?.appearance,
    },
    defaultNetwork: '',
    promptOnWrongNetwork,
    lang: lang as IInternalConfig['lang'],
    explorer: config.explorer || 'stellarchain',
    loginMethods: config.loginMethods || ['wallet'],
    showWalletUIs:
      config.showWalletUIs !== undefined ? config.showWalletUIs : true,
    ...(config?.walletConnect ? { walletConnect: config.walletConnect } : {}),
  };

  validateNetworkOptions(
    config.networks,
    config.defaultNetwork,
    config.transports,
  );

  conf.defaultNetwork = config.defaultNetwork ?? config.networks[0];

  const { horizon, soroban } = getNetworkRpc(
    conf.defaultNetwork,
    config.transports ?? {},
  );

  const { setConfig, setWallets, setIsReady, setStellar, setApiResponse } =
    getState();

  setStellar({
    activeNetwork: conf.defaultNetwork,
    servers: {
      horizon: new Horizon.Server(horizon),
      soroban: new rpc.Server(soroban),
    },
  });

  setConfig(conf);

  handleLoadWallets(excludeWallets, orderWallets).then((wallets) => {
    const includedWallets = wallets.filter(
      (w) =>
        // @ts-ignore
        !excludeWallets.includes(w.name.toLowerCase().replace(/\s+/g, '')),
    );

    setWallets(includedWallets);
    setIsReady(true);
  });

  if (config.walletConnect) {
    initializeWalletConnect(config.walletConnect, config.appName);
  }

  if (config.trezor) {
    initializeTrezor(config.trezor, config.appName);
  }

  authenticateAppId(config.appId).then((result) => {
    setApiResponse(result);

    const requestedSocials = conf.loginMethods.filter((m) =>
      isSocialProvider(String(m)),
    );

    // Email, passkey, and social logins all go through the Blux API, so they
    // need a valid appId.
    if (
      !result.isValid &&
      (conf.loginMethods.includes('email') ||
        conf.loginMethods.includes('passkey') ||
        requestedSocials.length > 0)
    ) {
      throw new Error('BLUX: config.appId is invalid.');
    }

    // Triggers a one-time warning for every social in loginMethods that the
    // owner has not enabled in the dashboard; those entries are ignored.
    getEnabledSocials(conf.loginMethods, result);
  });
}
