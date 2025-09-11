import { useStore } from "zustand";
import { createStore } from "zustand/vanilla";

import { Route } from "./enums";
import { defaultLightTheme } from "./constants/themes";
import { IInternalConfig, IStore, IWallet, WaitingStatus } from "./types";
import { walletsConfig } from "./wallets";

export const store = createStore<IStore>((set) => ({
  config: {
    appId: "",
    appName: "",
    networks: [],
    defaultNetwork: "",
    showWalletUIs: true,
    explorer: "stellarchain",
    appearance: defaultLightTheme,
  },
  stellar: undefined,
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
}));

export const { getState, setState, subscribe, getInitialState } = store;

export const useAppStore = <T>(selector: (state: IStore) => T): T =>
  useStore(store, selector);
