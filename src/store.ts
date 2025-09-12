import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";
import { Horizon } from "@stellar/stellar-sdk";

import { Route } from "./enums";
import { defaultLightTheme } from "./constants/themes";
import {
  IStore,
  IWallet,
  IStellarConfig,
  IInternalConfig,
  ISendTransaction,
} from "./types";

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
