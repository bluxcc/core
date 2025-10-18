import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { Horizon, rpc } from '@stellar/stellar-sdk';
import { SignClient } from '@walletconnect/sign-client/dist/types/client';

import { XLM } from './constants/assets';
import { Route, SupportedWallet } from './enums';
import { defaultLightTheme } from './constants/themes';
import { UseBalancesResult } from './hooks/useBalances';
import { syncExportedStore } from './exports/exportedStore';
import { UseTransactionsResult } from './hooks/useTransactions';
import {
  IAsset,
  IWallet,
  ISignMessage,
  IInternalConfig,
  ISendTransaction,
} from './types';

export type WaitingStatus = 'login' | 'sendTransaction' | 'signMessage';
export type AlertType = 'error' | 'success' | 'info' | 'warn' | 'none';

export interface IUser {
  address: string;
  walletPassphrase: string;
  authValue: string; // rabet, freighter, albedo, abcd@gmail.com, +1 555..., Gmail, Apple, etc..
  authMethod: string; // wallet, email, sms, social, etc..
}

export interface IStellarConfig {
  activeNetwork: string;
  servers: {
    horizon: Horizon.Server;
    soroban: rpc.Server;
  };
}

export interface ISelectAsset {
  field: 'send' | 'swapFrom' | 'swapTo';
  sendAsset: IAsset;
  swapToAsset: IAsset;
  swapFromAsset: IAsset;
}

export interface IStoreProperties {
  config: IInternalConfig;
  user?: IUser;
  authState: {
    isReady: boolean;
    isAuthenticated: boolean;
  };
  modal: {
    route: Route;
    isOpen: boolean;
    dynamicTitle: string;
    alert: {
      type: AlertType;
      message: string;
    };
  };
  showAllWallets: boolean;
  waitingStatus: WaitingStatus;
  wallets: IWallet[];
  stellar?: IStellarConfig;
  sendTransaction?: ISendTransaction;
  signMessage?: ISignMessage;
  balances: UseBalancesResult;
  transactions: UseTransactionsResult;
  selectAsset: ISelectAsset;
  walletConnect?: {
    connection: any;
    client: SignClient;
  };
  networkSyncDisabled: boolean;
}

export interface IStoreMethods {
  connectEmail: (email: string) => void;
  connectWallet: (walletName: string) => void;
  connectWalletSuccessful: (publicKey: string, passphrase: string) => void;
  closeModal: () => void;
  logoutAction: () => void;
  openModal: (route: Route) => void;
  setConfig: (config: IInternalConfig) => void;
  setIsReady: (isReady: boolean) => void;
  setShowAllWallets: (showAllWallets: boolean) => void;
  setRoute: (route: Route) => void;
  setSendTransaction: (
    sendTransaction: ISendTransaction,
    isOpen: boolean,
    route?: Route,
  ) => void;
  setSignMessage: (
    messageDetails: ISignMessage,
    isOpen: boolean,
    route?: Route,
  ) => void;
  setStellar: (stellar: IStellarConfig) => void;
  setWallets: (wallets: IWallet[]) => void;
  setAlert: (alert: AlertType, message: string) => void;
  setDynamicTitle: (title: string) => void;
  setBalances: (balances: UseBalancesResult) => void;
  setSelectAsset: (selectAsset: ISelectAsset) => void;
  setTransactions: (transactions: UseTransactionsResult) => void;
  setWalletConnectClient: (client: SignClient, connection: any) => void;
  cleanUp: (method: 'sendTransaction' | 'signMessage') => void;
  setNetworkSyncDisabled: () => void;
}

export interface IStore extends IStoreProperties, IStoreMethods {}

export const store = createStore<IStore>((set) => ({
  config: {
    appId: '',
    lang: 'en',
    appName: '',
    networks: [],
    defaultNetwork: '',
    excludeWallets: [],
    isPersistent: false,
    showWalletUIs: true,
    explorer: 'stellarchain',
    promptOnWrongNetwork: true,
    appearance: defaultLightTheme,
    walletConnect: {
      icons: [],
      url: '',
      projectId: '',
      description: '',
    },
  },
  stellar: undefined,
  signMessage: undefined,
  sendTransaction: undefined,
  wallets: [],
  waitingStatus: 'login',
  showAllWallets: false,
  modal: {
    isOpen: false,
    route: Route.ONBOARDING,
    dynamicTitle: '',
    alert: {
      type: 'none',
      message: '',
    },
  },
  authState: {
    isReady: false,
    isAuthenticated: false,
  },
  balances: {
    error: null,
    loading: false,
    balances: [],
  },
  transactions: {
    error: null,
    loading: false,
    transactions: [],
  },
  selectAsset: {
    field: 'send',
    sendAsset: XLM,
    swapToAsset: XLM,
    swapFromAsset: XLM,
  },
  walletConnectClient: undefined,
  networkSyncDisabled: false,
  setConfig: (config: IInternalConfig) =>
    set((state) => ({ ...state, config })),
  setWallets: (wallets: IWallet[]) => set((state) => ({ ...state, wallets })),
  setIsReady: (isReady: boolean) =>
    set((state) => ({ ...state, authState: { ...state.authState, isReady } })),
  setShowAllWallets: (showAllWallets: boolean) =>
    set((state) => ({ ...state, showAllWallets })),
  setRoute: (route: Route) =>
    set((state) => ({ ...state, modal: { ...state.modal, route } })),
  setSendTransaction: (
    sendTransaction: ISendTransaction,
    isOpen: boolean,
    route: Route = Route.SEND_TRANSACTION,
  ) =>
    set((state) => ({
      ...state,
      sendTransaction,
      modal: { ...state.modal, isOpen, route },
      waitingStatus: 'sendTransaction',
    })),
  setSignMessage: (
    signMessage: ISignMessage,
    isOpen: boolean,
    route: Route = Route.SIGN_MESSAGE,
  ) =>
    set((state) => ({
      ...state,
      signMessage,
      modal: { ...state.modal, isOpen, route },
      waitingStatus: 'signMessage',
    })),
  setStellar: (stellar: IStellarConfig) =>
    set((state) => ({ ...state, stellar })),
  approveSendTransaction: () =>
    set((state) => ({
      ...state,
      modal: { ...state.modal, isOpen: true, route: Route.WAITING },
      waitingStatus: 'sendTransaction',
    })),
  openModal: (route: Route) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        route,
        isOpen: true,
      },
    })),
  setDynamicTitle: (dynamicTitle: string) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        dynamicTitle,
      },
    })),
  setAlert: (alert: AlertType, message: string) =>
    set((state) => ({
      ...state,
      modal: {
        ...state.modal,
        alert: {
          type: alert,
          message,
        },
      },
    })),
  closeModal: () =>
    set((state) => ({ ...state, modal: { ...state.modal, isOpen: false } })),
  connectWallet: (walletName: string) =>
    set((state) => ({
      ...state,
      waitingStatus: 'login',
      user: {
        address: '',
        walletPassphrase: '',
        authMethod: 'wallet',
        authValue: walletName,
      },
      modal: {
        ...state.modal,
        isOpen: true,
        route:
          walletName === SupportedWallet.WalletConnect
            ? Route.WALLET_CONNECT
            : Route.WAITING,
      },
    })),
  connectWalletSuccessful: (publicKey: string, passphrase: string) =>
    set((state) => ({
      ...state,
      authState: {
        ...state.authState,
        isAuthenticated: true,
      },
      user: {
        ...state.user,
        address: publicKey,
        walletPassphrase: passphrase,
        authValue: state.user?.authValue || '',
        authMethod: state.user?.authMethod || '',
      },
    })),
  connectEmail: (email: string) =>
    set((state) => ({
      ...state,
      waitingStatus: 'login',
      user: {
        address: '',
        authValue: email,
        authMethod: 'email',
        walletPassphrase: '',
      },
      modal: {
        ...state.modal,
        isOpen: true,
        route: Route.OTP,
      },
    })),
  logoutAction: () =>
    set((state) => ({
      ...state,
      user: undefined,
      waitingStatus: 'login',
      authState: {
        ...state.authState,
        isAuthenticated: false,
      },
      modal: { ...state.modal, isOpen: false },
    })),
  setBalances: (balances: UseBalancesResult) =>
    set((state) => ({ ...state, balances })),
  setTransactions: (transactions: UseTransactionsResult) =>
    set((state) => ({ ...state, transactions })),
  setSelectAsset: (selectAsset: ISelectAsset) =>
    set((state) => ({ ...state, selectAsset })),
  setWalletConnectClient: (client: SignClient, connection: any) =>
    set((state) => ({ ...state, walletConnect: { client, connection } })),
  cleanUp: (prop) => set((state) => ({ ...state, [prop]: undefined })),
  setNetworkSyncDisabled: () =>
    set((state) => ({ ...state, networkSyncDisabled: true })),
}));

export const { getState, setState, subscribe, getInitialState } = store;

export const useAppStore = <T>(selector: (state: IStore) => T): T =>
  useStore(store, selector);

syncExportedStore(store);
