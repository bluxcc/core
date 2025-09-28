import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { Horizon, rpc } from '@stellar/stellar-sdk';

import { getState } from '../store';
import { Provider } from '../components/Provider';
import { IConfig, IInternalConfig } from '../types';
import { defaultLightTheme } from '../constants/themes';

import {
  getNetworkRpc,
  handleLoadWallets,
  validateNetworkOptions,
} from '../utils/helpers';

import '../tailwind.css';
import initializeWalletConnect from '../utils/initializeWalletConnect';

let root: any = null;
let isInitiated = false;
let container: HTMLDivElement | null = null;

const init = () => {
  container = document.createElement('div');
  document.body.appendChild(container);

  root = createRoot(container);
  root.render(createElement(Provider));
};

export function createConfig(config: IConfig) {
  if (isInitiated) {
    throw new Error('Config has already been set');
  }

  isInitiated = true;

  init();

  let excludeWallets = config.excludeWallets || [];

  // @ts-ignore
  excludeWallets = excludeWallets.map((x) => x.toLowerCase());

  const conf: IInternalConfig = {
    ...config,
    excludeWallets,
    appearance: {
      ...defaultLightTheme,
      ...config?.appearance,
    },
    lang: config.lang || 'en',
    defaultNetwork: '',
    showWalletUIs: !!config.showWalletUIs,
    explorer: config.explorer || 'stellarchain',
    loginMethods: config.loginMethods || ['wallet'],
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

  const { setConfig, setWallets, setIsReady, setStellar } = getState();

  setStellar({
    activeNetwork: conf.defaultNetwork,
    servers: {
      horizon: new Horizon.Server(horizon),
      soroban: new rpc.Server(soroban),
    },
  });

  setConfig(conf);

  handleLoadWallets().then((wallets) => {
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
}
