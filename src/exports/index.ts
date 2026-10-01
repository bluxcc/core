import { getState as getStoreState } from '../store';
import { BluxEventMap, ReadOnlyEmitter } from '../utils/events';
import { updateThemeAppearance } from '../utils/themeInheritance';
import type { IAppearanceConfig } from '../types';

export type {
  IAppearance,
  IAppearanceConfig,
  IConfig,
  IExplorer,
  ILoginMethods,
  IServers,
  ISocialProvider,
  IThemeInheritanceOptions,
  ITrezorMetaData,
  ITransports,
  IWalletConnectMetaData,
  IWalletNames,
  LanguageKey,
  ThemeInheritance,
  ThemeInheritanceSource,
  ThemeVariableMap,
} from '../types';
export type { IUser } from '../store';
export type { IExportedStore } from './exportedStore';
export type { LoginCodeApi, LoginCodeFn, LoginOAuthOptions } from './blux';

export { Asset } from '@stellar/stellar-sdk';
export * as StellarSdk from '@stellar/stellar-sdk';
export * from './core';
export * as core from './core';
export {
  blux,
  loginEmail,
  loginSms,
  loginOAuth,
  loginPasskey,
  loginWallet,
} from './blux';
export { BluxEvent } from '../utils/events';
export {
  getState,
  subscribe,
  getInitialState,
  useExportedStore,
} from './exportedStore';
export { getJwt, subscribeSession } from '../utils/sessionJwt';
export const setAppearance = (appearance: IAppearanceConfig) => {
  if (!updateThemeAppearance(appearance)) {
    const { inherit: _inherit, ...overrides } = appearance;

    getStoreState().setAppearance(overrides);
  }
};

export const events: ReadOnlyEmitter<BluxEventMap> = {
  on: (event, handler) => getStoreState().emitter.on(event, handler),
  off: (event, handler) => getStoreState().emitter.off(event, handler),
  once: (event, handler) => getStoreState().emitter.once(event, handler),
};
