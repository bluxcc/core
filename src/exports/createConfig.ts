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
import { getEnabledSocials } from '../utils/socialLogin';
import {
  getNetworkRpc,
  handleLoadWallets,
  loginMethodsIncludeWallet,
  validateNetworkOptions,
  validateOrderWallets,
} from '../utils/helpers';

export type {
  IAppearance,
  IConfig,
  IExplorer,
  ILoginMethods,
  IServers,
  ITrezorMetaData,
  ITransports,
  IWalletConnectMetaData,
  IWalletNames,
  LanguageKey,
} from '../types';

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
  root.render(
    createElement(Provider, {
      isBodyMount: element === document.body,
      mountElement: element === document.body ? undefined : element,
    }),
  );
};

/**
 * Initializes the Blux SDK: validates the config, mounts the Blux UI, loads
 * available wallets, wires up integrations (WalletConnect, Trezor), and
 * authenticates the app id. Call this once before any other Blux function.
 *
 * Wallet availability is always scanned in the background. `isReady` waits on
 * that scan only when `loginMethods` includes `'wallet'`; apps that omit
 * wallet login (email/SMS/social/passkey only) become ready as soon as the config
 * is applied, so they are not blocked by extension detection or `window.load`.
 *
 * @param config - The app configuration — see {@link IConfig}.
 * @param element - DOM element to mount the Blux UI into. Defaults to `document.body`.
 *   When set, the modal is centered horizontally in this element and vertically
 *   in the viewport, so a sidebar layout can offset it without it scrolling away.
 * @throws If `config` is empty or missing `appId`, `appName`, or `networks`, or if the network options are invalid.
 */
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

  const SUPPORTED_LANGS = ['en', 'es', 'pt', 'fr', 'de', 'ru', 'zh', 'ja', 'ko', 'tr'];
  let lang = (config.lang || 'en').trim().toLowerCase();

  if (!SUPPORTED_LANGS.includes(lang)) {
    console.warn(
      `BLUX: '${config.lang}' is not a supported language (${SUPPORTED_LANGS.join(', ')}). Falling back to English.`,
    );

    lang = 'en';
  }

  if (config.isPersistent) {
    console.warn(
      'BLUX: isPersistent: true is only for testing purposes. Know what you are doing. For a better experience with Blux, remove isPersistent: true.',
    );
  }

  init(element);

  let excludeWallets = config.excludeWallets || ['lobstr'];

  // @ts-ignore
  excludeWallets = excludeWallets.map((x) => x.toLowerCase().replace(/\s+/g, ''));

  const orderWallets = validateOrderWallets(config.orderWallets);

  // Opt-in: the wrong-network modal only ever appears when the consumer
  // explicitly asks for it.
  let promptOnWrongNetwork = false;

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

  const usesWalletLogin = loginMethodsIncludeWallet(conf.loginMethods);

  // Email/SMS/social/passkey-only apps (e.g. dashboard.blux.cc) must not wait on
  // wallet extension detection: each isAvailable() can take hundreds of
  // milliseconds, and handleLoadWallets also waits for window load. Flip
  // isReady now and still scan wallets in the background so they are ready if
  // the app later needs them.
  if (!usesWalletLogin) {
    setIsReady(true);
  }

  handleLoadWallets(excludeWallets, orderWallets).then((wallets) => {
    const includedWallets = wallets.filter(
      (w) =>
        // @ts-ignore
        !excludeWallets.includes(w.name.toLowerCase().replace(/\s+/g, '')),
    );

    setWallets(includedWallets);

    if (usesWalletLogin) {
      setIsReady(true);
    }
  });

  if (config.walletConnect) {
    initializeWalletConnect(config.walletConnect, config.appName);
  }

  if (config.trezor) {
    initializeTrezor(config.trezor, config.appName);
  }

  authenticateAppId(config.appId).then((result) => {
    setApiResponse(result);

    if (!result.isValid) {
      // The appId could not be validated — missing, wrong, deleted, used from a
      // disallowed origin, or the Blux API was unreachable. Blux is now
      // disabled: login() and every signing entry point throw via
      // assertAppIsValid(). Throwing here would only surface as an unhandled
      // promise rejection (this runs in an un-awaited .then), so log loudly and
      // let the public methods do the enforcing.
      console.error(
        `BLUX: appId is invalid${result.message ? ` — ${result.message}` : ''}.` +
          ' Login and signing are disabled.',
      );

      return;
    }

    getEnabledSocials(conf.loginMethods, result);

    const wantsSms = (conf.loginMethods || []).some(
      (method) => String(method).toLowerCase().trim() === 'sms',
    );

    if (wantsSms && !result.smsEnabled) {
      console.error(
        'BLUX: SMS login requires a paid Blux plan. SMS will not be offered until this app is upgraded.',
      );
    }
  });
}
