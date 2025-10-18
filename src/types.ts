import { Horizon } from '@stellar/stellar-sdk';

import { SupportedWallet } from './enums';

export type LanguageKey = 'en' | 'es';

export type ITransports = Record<string, IServers>;

export type IExplorer =
  | 'steexp'
  | 'stellarchain'
  | 'stellarexpert'
  | 'lumenscan';

export type ILoginMethods = Array<'wallet' | 'sms' | 'email' | 'passkey'>;

export type IWalletNames = Array<
  | 'rabet'
  | 'albedo'
  | 'freighter'
  | 'xbull'
  | 'lobstr'
  | 'hana'
  | 'hot'
  | 'klever'
>;

interface IServers {
  horizon: string;
  soroban: string;
}

export interface IWalletConnectMetaData {
  icons: [];
  url: string;
  projectId: string;
  description: string;
}

export interface IConfig {
  appId?: string;
  appName: string;
  networks: string[];
  defaultNetwork?: string;
  appearance?: Partial<IAppearance>;
  lang?: LanguageKey;
  explorer?: IExplorer;
  isPersistent?: boolean;
  showWalletUIs?: boolean;
  loginMethods?: ILoginMethods;
  transports?: ITransports;
  excludeWallets?: IWalletNames;
  walletConnect?: IWalletConnectMetaData;
  promptOnWrongNetwork?: boolean;
}

export interface IInternalConfig extends IConfig {
  explorer: IExplorer;
  appearance: IAppearance;
  showWalletUIs: boolean;
  defaultNetwork: string;
  lang: LanguageKey;
  excludeWallets: IWalletNames;
  promptOnWrongNetwork: boolean;
}

export interface IAppearance {
  background: string; // Modal or component background color/image
  fieldBackground: string; // Background color for input fields or UI sections
  accentColor: string; // Primary accent or highlight color
  textColor: string; // Main text color
  font: string; // Font family or style
  outlineWidth?: string; // Optional outline width (e.g., '2px') (falls back to borderColor)
  outlineColor?: string; // Optional outline color (falls back to borderColor)
  outlineRadius?: string; // Optional Corner radius for modal (falls back to borderRadius)
  borderRadius: string; // Corner radius for UI elements
  borderColor: string; // Border color for elements
  borderWidth: string; // Border width (e.g., '1px', '0', etc.)
  logo: string; // App logo URL
  backdropBlur: string; // Blur level for backdrop (e.g., '8px')
  backdropColor: string; // Backdrop color behind modal or overlay
  boxShadow: string; // Box shadow style for modal
}

export interface IWallet {
  name: SupportedWallet;
  website: string;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
  getNetwork: () => Promise<{
    network: string;
    passphrase: string;
  }>;
  isAvailable: () => Promise<boolean>;
  signAuthEntry: (
    authorizationEntry: string,
    options: {
      network: string;
      address: string;
    },
  ) => Promise<string>;
  signMessage: (
    message: string,
    options: {
      address: string;
      network: string;
    },
  ) => Promise<string>;
  signTransaction: (
    xdr: string,
    options: {
      network: string;
      address: string;
    },
  ) => Promise<string>;
}

export interface IAccountData {
  id: string;
  sequence: string;
  xlmBalance: string;
  subentry_count: number;
  balances: Horizon.HorizonApi.BalanceLine[];
  thresholds: Horizon.HorizonApi.AccountThresholds;
  transactions?: Horizon.ServerApi.TransactionRecord[];
}

export interface IAsset {
  logo?: string | React.ReactNode;
  valueInCurrency?: string;
  assetBalance: string;
  assetCode: string;
  assetType: string;
  assetIssuer: string;
}

export interface ISignOptions {
  network: string;
}

export type SendTransactionResult =
  Horizon.HorizonApi.SubmitTransactionResponse;

export interface ISendTransaction {
  xdr: string;
  wallet: IWallet;
  options: ISignOptions;
  result?: SendTransactionResult;
  rejecter: (reason: any) => void;
  resolver: (value: SendTransactionResult) => void;
}

export interface ISignMessage {
  wallet: IWallet;
  message: string;
  options: ISignOptions;
  result?: string;
  rejecter: (reason: any) => void;
  resolver: (value: string) => void;
}
