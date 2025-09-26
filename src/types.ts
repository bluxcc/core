import { Horizon } from "@stellar/stellar-sdk";

import { SupportedWallet } from "./enums";

export type LanguageKey = "en" | "es";

export type ITransports = Record<string, IServers>;

export type IExplorer =
  | "steexp"
  | "stellarchain"
  | "stellarexpert"
  | "lumenscan";

export type ILoginMethods = Array<"wallet" | "sms" | "email" | "passkey">;

export type SignMessageResult = {
  signedMessage: string;
  signerPublicKey?: string;
};

interface IServers {
  horizon: string;
  soroban: string;
}

interface IWalletConnectMetaData{
  icons: [],
  url:string,
  projectId: string,
  description: string
}

export interface IConfig {
  appId: string;
  appName: string;
  networks: string[];
  defaultNetwork?: string;
  appearance?: Partial<IAppearance>;
  lang?: LanguageKey;
  explorer?: IExplorer;
  showWalletUIs?: boolean;
  loginMethods?: ILoginMethods;
  transports?: ITransports;
  walletConnect?: IWalletConnectMetaData
}

export interface IInternalConfig extends IConfig {
  explorer: IExplorer;
  appearance: IAppearance;
  showWalletUIs: boolean;
  defaultNetwork: string;
  lang: LanguageKey;
}

export interface IAppearance {
  background: string; // Background color or image
  fieldBackground: string; // Background color for input fields or similar UI areas
  accentColor: string; // Primary accent color
  textColor: string; // Main text color
  font: string; // Selected font family or style
  outlineWidth: string;
  borderRadius: string; // Border radius for UI elements
  borderColor: string; // Border color for elements
  borderWidth: string; // Width of borders (e.g., '1px', '0', etc.)
  logo: string; // Optional application logo URL
}

export interface IWallet {
  name: SupportedWallet;
  website: string;
  isAvailable: () => Promise<boolean> | boolean;
  connect: () => Promise<{ publicKey: string }>;
  getAddress?: (options?: { path?: string }) => Promise<{ address: string }>;
  signTransaction?: (
    xdr: string,
    options?: {
      networkPassphrase?: string;
      address?: string;
      submit?: boolean;
    },
  ) => Promise<string>;
  disconnect?: () => Promise<void>;
  getNetwork: () => Promise<{
    network: string;
    passphrase: string;
  }>;
  signMessage?: (
    message: string,
    options: {
      address: string;
      networkPassphrase: string;
    },
  ) => Promise<SignMessageResult>;
  signAuthEntry?: (
    authorizationEntry: string,
    options?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ) => Promise<{ signedAuthorizationEntry: string; signerPublicKey?: string }>;
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
  result?: SignMessageResult;
  rejecter: (reason: any) => void;
  resolver: (value: SignMessageResult) => void;
}
