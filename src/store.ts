import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { Horizon, rpc } from '@stellar/stellar-sdk';
import { SignClient } from '@walletconnect/sign-client/dist/types/client';

import { XLM } from './constants/assets';
import { Route, SupportedWallet } from './enums';
import { defaultLightTheme } from './constants/themes';
import type { UseBalancesResult } from './hooks/useBalances';
import { syncExportedStore } from './exports/exportedStore';
import Emitter, { BluxEvent, BluxEventMap } from './utils/events';
import {
  IAsset,
  IWallet,
  IAppearance,
  AssetMetaMap,
  ICustomToken,
  ICustomTokens,
  ISignMessage,
  IInternalConfig,
  ISendTransaction,
  AuthenticateApiResponse,
  ISignAuthEntry,
} from './types';

export type AlertType = 'error' | 'success' | 'warn' | 'none' | 'copy';
export type WaitingStatus =
  | 'login'
  | 'sendTransaction'
  | 'signMessage'
  | 'signAuthEntry';

export interface ILogo {
  id: number;
  name: string;
  content: string;
  default_values?: {
    name: string;
    value: string;
  }[];
}

export interface IUser {
  address: string;
  identifier?: string;
  walletPassphrase: string;
  authValue: string; // rabet, freighter, albedo, abcd@gmail.com, +1 555..., Gmail, Apple, etc..
  authMethod: string; // wallet, email, sms, social, etc..
}

export interface IAuth {
  isAuthenticated: boolean;
  JWT: string;
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
  // True once the user has explicitly picked an asset in SelectAsset. Used to
  // suppress the same-asset swap error for the untouched defaults.
  userPicked?: boolean;
}

export interface ILoginPromise {
  isSilent: boolean;
  promise: Promise<IUser>;
  rejecter: (reason: any) => void;
  resolver: (value: IUser) => void;
}

export interface IStoreProperties {
  logos: ILogo[] | null;
  assetMeta: AssetMetaMap | null;
  emitter: Emitter<BluxEventMap>;
  auth?: IAuth;
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
  signAuthEntry?: ISignAuthEntry;
  login?: ILoginPromise;
  // User-facing message shown when a login is rejected because the project
  // restricts access (allowlist/blocklist). Set only for that case.
  loginError?: string;
  balances: UseBalancesResult;
  // USD value of each balance, keyed by `balanceLineKey` (see utils/prices).
  // Populated asynchronously after balances load; absent keys mean "not priced
  // yet" and the UI falls back to showing no value.
  balanceValues: Record<string, string>;
  // Bumped to refetch balances and custom-token balances (20s interval while
  // signed in, and whenever the profile modal opens). Activity is fetched only
  // while that page is mounted.
  accountRefreshNonce: number;
  selectAsset: ISelectAsset;
  detailsAsset?: IAsset;
  // Custom SAC/SEP-41 tokens the user added, grouped by API network bucket
  // (mainnet/testnet). Fetched from the Blux API on login; balances are read
  // on-chain. Both buckets are kept so switching network needs no refetch.
  customTokens: ICustomTokens;
  // Which Balances tab is active. Persisted here (not local state) so returning
  // from a token/asset details page restores the tab the user was on.
  balancesTab: 'assets' | 'tokens';
  // The custom token whose details page is open (mirrors detailsAsset).
  detailsToken?: ICustomToken;
  walletConnect?: {
    connection: any;
    client: SignClient;
  };
  networkSyncDisabled: boolean;
  apiResponse?: AuthenticateApiResponse;
}

export interface IStoreMethods {
  connectEmail: (email: string) => void;
  connectSms: (phone: string) => void;
  connectSocial: (provider: string) => void;
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
  setSignAuthEntry: (
    authEntry: ISignAuthEntry,
    isOpen: boolean,
    route?: Route,
  ) => void;
  setStellar: (stellar: IStellarConfig) => void;
  setWallets: (wallets: IWallet[]) => void;
  setAlert: (alert: AlertType, message: string) => void;
  setDynamicTitle: (title: string) => void;
  setBalances: (balances: UseBalancesResult) => void;
  setBalanceValues: (balanceValues: Record<string, string>) => void;
  setSelectAsset: (selectAsset: ISelectAsset) => void;
  setDetailsAsset: (asset: IAsset | undefined) => void;
  setCustomTokens: (customTokens: ICustomTokens) => void;
  addCustomToken: (token: ICustomToken) => void;
  removeCustomToken: (network: 'mainnet' | 'testnet', id: number) => void;
  setCustomTokenBalances: (
    network: 'mainnet' | 'testnet',
    balances: Record<number, string>,
  ) => void;
  setBalancesTab: (tab: 'assets' | 'tokens') => void;
  setDetailsToken: (token: ICustomToken | undefined) => void;
  bumpAccountRefresh: () => void;
  setWalletConnectClient: (client: SignClient, connection: any) => void;
  cleanUp: (method: 'sendTransaction' | 'signMessage' | 'signAuthEntry') => void;
  setNetworkSyncDisabled: (isDisabled: boolean) => void;
  setAppearance: (newAppearance: Partial<IAppearance>) => void;
  setApiResponse: (res: AuthenticateApiResponse) => void;
  setAuth: (a: IAuth) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setLogin: (loginDetails: ILoginPromise | undefined) => void;
  setLoginError: (message?: string) => void;
  setLogos: (logos: ILogo[]) => void;
  setAssetMeta: (assetMeta: AssetMetaMap) => void;
}

export interface IStore extends IStoreProperties, IStoreMethods { }

const emitter = new Emitter<BluxEventMap>();

// Asset selections reference network-specific balances/issuers, so they are
// restored to this whenever the active network changes or the user logs out.
const DEFAULT_SELECT_ASSET: ISelectAsset = {
  field: 'send',
  sendAsset: XLM,
  swapToAsset: XLM,
  swapFromAsset: XLM,
  userPicked: false,
};

export const store = createStore<IStore>((set) => ({
  logos: null,
  assetMeta: null,
  emitter,
  auth: undefined,
  config: {
    appId: '',
    lang: 'en',
    appName: '',
    networks: [],
    defaultNetwork: '',
    excludeWallets: [],
    isPersistent: false,
    showWalletUIs: true,
    loginMethods: ['wallet'],
    explorer: 'stellarchain',
    promptOnWrongNetwork: false,
    appearance: defaultLightTheme,
    walletConnect: {
      icons: [],
      url: '',
      projectId: '',
      description: '',
    },
  },
  login: undefined,
  loginError: undefined,
  stellar: undefined,
  signMessage: undefined,
  signAuthEntry: undefined,
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
  balanceValues: {},
  apiResponse: undefined,
  accountRefreshNonce: 0,
  selectAsset: { ...DEFAULT_SELECT_ASSET },
  detailsAsset: undefined,
  customTokens: { mainnet: [], testnet: [] },
  balancesTab: 'assets',
  detailsToken: undefined,
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
  setSignAuthEntry: (
    authEntry: ISignAuthEntry,
    isOpen: boolean,
    route: Route = Route.SIGN_MESSAGE,
  ) =>
    set((state) => ({
      ...state,
      signAuthEntry: authEntry,
      modal: { ...state.modal, isOpen, route },
      waitingStatus: 'signAuthEntry',
    })),
  setStellar: (stellar: IStellarConfig) =>
    set((state) => {
      // A network switch invalidates the picked assets (their issuers and
      // balances belong to the previous network); reset to defaults so pages
      // like Swap don't keep showing stale data.
      const networkChanged =
        !!state.stellar &&
        state.stellar.activeNetwork !== stellar.activeNetwork;

      return {
        ...state,
        stellar,
        ...(networkChanged
          ? {
              selectAsset: { ...DEFAULT_SELECT_ASSET },
              detailsAsset: undefined,
              // A token's details belong to the previous network; clear it.
              // customTokens itself is kept (both buckets persist across switches).
              detailsToken: undefined,
              balanceValues: {},
              balances: { error: null, loading: true, balances: [] },
              accountRefreshNonce: state.accountRefreshNonce + 1,
            }
          : {}),
      };
    }),
  approveSendTransaction: () =>
    set((state) => ({
      ...state,
      modal: { ...state.modal, isOpen: true, route: Route.WAITING },
      waitingStatus: 'sendTransaction',
    })),
  openModal: (route: Route) => {
    set((state) => ({
      ...state,
      // A fresh onboarding session always starts on the main login screen,
      // not the leftover "all wallets" list from a previous attempt.
      showAllWallets:
        route === Route.ONBOARDING ? false : state.showAllWallets,
      modal: {
        ...state.modal,
        route,
        isOpen: true,
      },
    }));

    getState().emitter.emit(BluxEvent.ModalOpened, {
      modal: route,
      reason: 'openModal',
    });
  },
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
    set((current) => ({
      ...current,
      showAllWallets: false,
      modal: { ...current.modal, isOpen: false },
    })),
  connectWallet: (walletName: string) => {
    const route =
      walletName === SupportedWallet.WalletConnect
        ? Route.WALLET_CONNECT
        : Route.WAITING;

    set((state) => ({
      ...state,
      loginError: undefined,
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
        route,
      },
    }));

    getState().emitter.emit(BluxEvent.ModalOpened, {
      modal: route,
      reason: 'connectWallet',
      meta: { walletName },
    });
  },
  setIsAuthenticated: (isAuthenticated: boolean) =>
    set((state) => ({
      ...state,
      authState: { ...state.authState, isAuthenticated },
    })),
  connectWalletSuccessful: (publicKey: string, passphrase: string) =>
    set((state) => ({
      ...state,
      authState: {
        ...state.authState,
        // isAuthenticated: true,
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
      loginError: undefined,
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
  connectSms: (phone: string) =>
    set((state) => ({
      ...state,
      loginError: undefined,
      waitingStatus: 'login',
      user: {
        address: '',
        authValue: phone,
        authMethod: 'sms',
        walletPassphrase: '',
      },
      modal: {
        ...state.modal,
        isOpen: true,
        route: Route.OTP,
      },
    })),
  connectSocial: (provider: string) =>
    set((state) => ({
      ...state,
      loginError: undefined,
      waitingStatus: 'login',
      user: {
        address: '',
        authValue: '',
        authMethod: provider,
        walletPassphrase: '',
      },
      modal: {
        ...state.modal,
        isOpen: true,
        route: Route.SOCIALS_ONBOARDING,
      },
    })),
  logoutAction: () =>
    set((current) => ({
      ...current,
      user: undefined,
      auth: undefined,
      loginError: undefined,
      waitingStatus: 'login',
      showAllWallets: false,
      selectAsset: { ...DEFAULT_SELECT_ASSET },
      detailsAsset: undefined,
      detailsToken: undefined,
      // Custom tokens are user-specific; drop them so the next account starts clean.
      customTokens: { mainnet: [], testnet: [] },
      balancesTab: 'assets',
      balanceValues: {},
      balances: { error: null, loading: false, balances: [] },
      authState: {
        ...current.authState,
        isAuthenticated: false,
      },
      modal: { ...current.modal, isOpen: false },
    })),
  setBalances: (balances: UseBalancesResult) =>
    set((state) => ({ ...state, balances })),
  setBalanceValues: (balanceValues: Record<string, string>) =>
    set((state) => ({ ...state, balanceValues })),
  setAuth: (auth: IAuth) => set((state) => ({ ...state, auth })),
  bumpAccountRefresh: () =>
    set((state) => ({
      ...state,
      accountRefreshNonce: state.accountRefreshNonce + 1,
    })),
  setSelectAsset: (selectAsset: ISelectAsset) =>
    set((state) => ({ ...state, selectAsset })),
  setDetailsAsset: (detailsAsset: IAsset | undefined) =>
    set((state) => ({ ...state, detailsAsset })),
  setCustomTokens: (customTokens: ICustomTokens) =>
    set((state) => ({ ...state, customTokens })),
  addCustomToken: (token: ICustomToken) =>
    set((state) => {
      const bucket = state.customTokens[token.network] ?? [];
      // Drop any existing entry for the same id/contract so a re-add can't duplicate.
      const deduped = bucket.filter(
        (t) => t.id !== token.id && t.contractAddress !== token.contractAddress,
      );

      return {
        ...state,
        customTokens: {
          ...state.customTokens,
          [token.network]: [...deduped, token],
        },
      };
    }),
  removeCustomToken: (network: 'mainnet' | 'testnet', id: number) =>
    set((state) => ({
      ...state,
      customTokens: {
        ...state.customTokens,
        [network]: (state.customTokens[network] ?? []).filter(
          (t) => t.id !== id,
        ),
      },
    })),
  setCustomTokenBalances: (
    network: 'mainnet' | 'testnet',
    balances: Record<number, string>,
  ) =>
    set((state) => ({
      ...state,
      customTokens: {
        ...state.customTokens,
        [network]: (state.customTokens[network] ?? []).map((t) =>
          balances[t.id] != null ? { ...t, balance: balances[t.id] } : t,
        ),
      },
    })),
  setBalancesTab: (balancesTab: 'assets' | 'tokens') =>
    set((state) => ({ ...state, balancesTab })),
  setDetailsToken: (detailsToken: ICustomToken | undefined) =>
    set((state) => ({ ...state, detailsToken })),
  setWalletConnectClient: (client: SignClient, connection: any) =>
    set((state) => ({ ...state, walletConnect: { client, connection } })),
  cleanUp: (prop) => set((state) => ({ ...state, [prop]: undefined })),
  setNetworkSyncDisabled: (isDisabled: boolean) =>
    set((state) => ({ ...state, networkSyncDisabled: isDisabled })),
  setAppearance: (newAppearance: Partial<IAppearance>) =>
    set((state) => ({
      ...state,
      config: {
        ...state.config,
        appearance: {
          ...state.config.appearance,
          ...newAppearance,
        },
      },
    })),
  setApiResponse: (apiResponse: AuthenticateApiResponse) =>
    set((state) => ({
      ...state,
      apiResponse,
    })),
  setLoginError: (message?: string) =>
    set((state) => ({ ...state, loginError: message })),
  setLogin: (loginDetails: ILoginPromise | undefined) =>
    set((state) => ({
      ...state,
      login: loginDetails,
    })),
  setLogos: (logos: ILogo[]) =>
    set((state) => ({
      ...state,
      logos,
    })),
  setAssetMeta: (assetMeta: AssetMetaMap) =>
    set((state) => ({
      ...state,
      assetMeta,
    })),
}));

export const { getState, setState, subscribe, getInitialState } = store;

export const useAppStore = <T>(selector: (state: IStore) => T): T =>
  useStore(store, selector);

syncExportedStore(store);
