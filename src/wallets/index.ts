import { hotConfig } from './hot';
import { IWallet } from '../types';
import { hanaConfig } from './hana';
import { rabetConfig } from './rabet';
import { xBullConfig } from './xbull';
import { albedoConfig } from './albedo';
import { kleverConfig } from './klever';
import { lobstrConfig } from './lobstr';
import { SupportedWallet } from '../enums';
import { freighterConfig } from './freighter';
import { walletConnectConfig } from './walletConnect';
import { ledgerConfig } from './ledger';
import { apiConfig } from './api';

export const walletsConfig: Record<SupportedWallet, IWallet> = {
  [SupportedWallet.Freighter]: freighterConfig,
  [SupportedWallet.Rabet]: rabetConfig,
  [SupportedWallet.WalletConnect]: walletConnectConfig,
  [SupportedWallet.Xbull]: xBullConfig,
  [SupportedWallet.Hot]: hotConfig,
  [SupportedWallet.Api]: apiConfig,
  [SupportedWallet.Hana]: hanaConfig,
  [SupportedWallet.Lobstr]: lobstrConfig,
  [SupportedWallet.Ledger]: ledgerConfig,
  [SupportedWallet.Albedo]: albedoConfig,
  [SupportedWallet.Klever]: kleverConfig,
};
