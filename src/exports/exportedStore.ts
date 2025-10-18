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
}

export const exportedStore = createStore<IExportedStore>(() => ({
  config: {
    appId: '',
    lang: 'en',
    appName: '',
    networks: [],
    defaultNetwork: '',
    excludeWallets: [],
    showWalletUIs: true,
    explorer: 'stellarchain',
    isPersistent: false,
    promptOnWrongNetwork: true,
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
}));

export const syncExportedStore = (mainStore: typeof store) => {
  const mainState = mainStore.getState();

  exportedStore.setState({
    user: mainState.user,
    config: mainState.config,
    stellar: mainState.stellar,
    authState: mainState.authState,
  });

  return mainStore.subscribe((state) => {
    exportedStore.setState({
      user: state.user,
      config: state.config,
      stellar: state.stellar,
      authState: state.authState,
    });
  });
};

export const useExportedStore = <T>(
  selector: (state: IExportedStore) => T,
): T => useStore(exportedStore, selector);

export const { getState, subscribe, getInitialState } = exportedStore;
