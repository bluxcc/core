import { createElement } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { Horizon, rpc } from '@stellar/stellar-sdk';

import { getState } from '../store';
import { authenticateAppId } from '../utils/api';
import { Provider } from '../components/Provider';
import { IConfig, IInternalConfig } from '../types';
import { defaultLightTheme } from '../constants/themes';
import { initializeWalletConnect } from '../utils/initializeWalletConnect';
import {
  getNetworkRpc,
  handleLoadWallets,
  validateNetworkOptions,
} from '../utils/helpers';

import '../tailwind.css';

let root: Root | null = null;
let isInitiated = false;
let container: HTMLDivElement | null = null;
let lastParentElement: HTMLElement | null = null;

const cleanUpBlux = () => {
  if (root) {
    queueMicrotask(() => {
      try {
        if (root) {
          root.unmount();
          root = null;
        }
      } catch { }
    });
  }

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

  init(element);

  let excludeWallets = config.excludeWallets || ['lobstr'];

  // @ts-ignore
  excludeWallets = excludeWallets.map((x) => x.toLowerCase());

  let promptOnWrongNetwork = true;

  if (config.promptOnWrongNetwork !== undefined) {
    promptOnWrongNetwork = config.promptOnWrongNetwork;
  }

  const conf: IInternalConfig = {
    ...config,
    excludeWallets,
    appearance: {
      ...defaultLightTheme,
      ...config?.appearance,
    },
    defaultNetwork: '',
    promptOnWrongNetwork,
    lang: config.lang || 'en',
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

  handleLoadWallets(excludeWallets).then((wallets) => {
    const includedWallets = wallets.filter(
      (w) =>
        // @ts-ignore
        !excludeWallets.includes(w.name.toLowerCase()),
    );

    setWallets(includedWallets);
    setIsReady(true);
  });

  if (config.walletConnect) {
    initializeWalletConnect(config.walletConnect, config.appName);
  }

  authenticateAppId(config.appId).then((result) => {
    setApiResponse(result);

    if (
      (!result.isValid && conf.loginMethods.includes('email')) ||
      conf.loginMethods.includes('passkey')
    ) {
      conf.loginMethods = ['wallet'];

      setConfig(conf);
    }
  });
}
