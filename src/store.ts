import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { Horizon, rpc } from "@stellar/stellar-sdk";

import { Route } from "./enums";
import { defaultLightTheme } from "./constants/themes";
import { IWallet, IInternalConfig, ISendTransaction } from "./types";

export type WaitingStatus = "login" | "sendTransaction" | "signMessage";

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
  };
  waitingStatus: WaitingStatus;
  wallets: IWallet[];
  stellar?: IStellarConfig;
  // account?: GetAccountResult;
  sendTransaction?: ISendTransaction;
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
  setRoute: (route: Route) => void;
  setSendTransaction: (sendTransaction: ISendTransaction) => void;
  setStellar: (stellar: IStellarConfig) => void;
  setWallets: (wallets: IWallet[]) => void;
  sendTransactionSuccessful: (sendTransaction: ISendTransaction) => void;
}

export interface IStore extends IStoreProperties, IStoreMethods {}

export const store = createStore<IStore>((set) => ({
  config: {
    appId: "",
    lang: "en",
    appName: "",
    networks: [],
    defaultNetwork: "",
    showWalletUIs: true,
    explorer: "stellarchain",
    appearance: defaultLightTheme,
  },
  stellar: undefined,
  sendTransaction: undefined,
  wallets: [],
  waitingStatus: "login",
  modal: {
    isOpen: false,
    route: Route.ONBOARDING,
  },
  authState: {
    isReady: false,
    isAuthenticated: false,
  },
  setConfig: (config: IInternalConfig) =>
    set((state) => ({ ...state, config })),
  setWallets: (wallets: IWallet[]) => set((state) => ({ ...state, wallets })),
  setIsReady: (isReady: boolean) =>
    set((state) => ({ ...state, authState: { ...state.authState, isReady } })),
  setRoute: (route: Route) =>
    set((state) => ({ ...state, modal: { ...state.modal, route } })),
  setSendTransaction: (sendTransaction: ISendTransaction) =>
    set((state) => ({
      ...state,
      sendTransaction,
      modal: { ...state.modal, isOpen: true, route: Route.SEND_TRANSACTION },
    })),
  setStellar: (stellar: IStellarConfig) =>
    set((state) => ({ ...state, stellar })),
  approveSendTransaction: () =>
    set((state) => ({
      ...state,
      modal: { ...state.modal, isOpen: true, route: Route.WAITING },
      waitingStatus: "sendTransaction",
    })),
  sendTransactionSuccessful: (sendTransaction: ISendTransaction) =>
    set((state) => ({
      ...state,
      sendTransaction,
      modal: {
        ...state.modal,
        isOpen: true,
        route: Route.SUCCESSFUL,
      },
    })),
  openModal: (route: Route) =>
    set((state) => ({
      ...state,
      modal: {
        route,
        isOpen: true,
      },
    })),
  closeModal: () =>
    set((state) => ({ ...state, modal: { ...state.modal, isOpen: false } })),
  connectWallet: (walletName: string) =>
    set((state) => ({
      ...state,
      waitingStatus: "login",
      user: {
        address: "",
        walletPassphrase: "",
        authMethod: "wallet",
        authValue: walletName,
      },
      modal: {
        ...state.modal,
        isOpen: true,
        route: Route.WAITING,
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
        authValue: state.user?.authValue || "",
        authMethod: state.user?.authMethod || "",
      },
    })),
  connectEmail: (email: string) =>
    set((state) => ({
      ...state,
      waitingStatus: "login",
      user: {
        address: "",
        authValue: email,
        authMethod: "email",
        walletPassphrase: "",
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
      waitingStatus: "login",
      authState: {
        ...state.authState,
        isAuthenticated: false,
      },
      modal: { ...state.modal, isOpen: false },
    })),
}));

export const { getState, setState, subscribe, getInitialState } = store;

export const useAppStore = <T>(selector: (state: IStore) => T): T =>
  useStore(store, selector);
