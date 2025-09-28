// import { hotConfig } from "./hot";
import { IWallet } from '../types';
import { hanaConfig } from './hana';
import { rabetConfig } from './rabet';
import { xBullConfig } from './xbull';
import { albedoConfig } from './albedo';
import { lobstrConfig } from './lobstr';
import { SupportedWallet } from '../enums';
import { freighterConfig } from './freighter';
import { walletConnectConfig } from './walletConnect';

export const walletsConfig: Record<SupportedWallet, IWallet> = {
  [SupportedWallet.Hana]: hanaConfig,
  [SupportedWallet.Rabet]: rabetConfig,
  [SupportedWallet.Lobstr]: lobstrConfig,
  [SupportedWallet.Freighter]: freighterConfig,
  [SupportedWallet.WalletConnect]: walletConnectConfig,
  [SupportedWallet.Xbull]: xBullConfig,
  [SupportedWallet.Albedo]: albedoConfig,
  // [SupportedWallet.Hot]: hotConfig,
};
