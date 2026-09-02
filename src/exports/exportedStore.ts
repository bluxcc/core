import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { IInternalConfig } from '../types';
import { defaultLightTheme } from '../constants/themes';
import { IStellarConfig, IUser, store } from '../store';

export interface IExportedStore {
  config: IInternalConfig;
  user?: IUser;
  authState: {
    isReady: boolean;
    isAuthenticated: boolean;
  };
  stellar?: IStellarConfig;
  /** Installed wallets currently offered in the picker. */
  wallets: Array<{ name: string }>;
}

export const exportedStore = createStore<IExportedStore>(() => ({
  config: {
    appId: '',
    lang: 'en',
    appName: '',
    networks: [],
    defaultNetwork: '',
    excludeWallets: [],
    loginMethods: ['wallet'],
    showWalletUIs: true,
    explorer: 'stellarchain',
    isPersistent: false,
    promptOnWrongNetwork: false,
    appearance: defaultLightTheme,
    walletConnect: {
      icons: [],
      url: '',
      projectId: '',
      description: '',
    },
  },
  user: undefined,
  authState: {
    isReady: false,
    isAuthenticated: false,
  },
  stellar: undefined,
  wallets: [],
}));

export const syncExportedStore = (mainStore: typeof store) => {
  const mainState = mainStore.getState();

  exportedStore.setState({
    user: mainState.user,
    config: mainState.config,
    stellar: mainState.stellar,
    authState: mainState.authState,
    wallets: mainState.wallets.map((wallet) => ({ name: wallet.name })),
  });

  return mainStore.subscribe((state) => {
    exportedStore.setState({
      user: state.user,
      config: state.config,
      stellar: state.stellar,
      authState: state.authState,
      wallets: state.wallets.map((wallet) => ({ name: wallet.name })),
    });
  });
};

export const useExportedStore = <T>(
  selector: (state: IExportedStore) => T,
): T => useStore(exportedStore, selector);

export const { getState, subscribe, getInitialState } = exportedStore;
