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

interface IServers {
  horizon: string;
  soroban: string;
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
    options?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ) => Promise<{ signedMessage: string; signerPublicKey?: string }>;
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
  logo?: string;
  balance: string;
  assetCode: string;
  assetType: string;
  assetIssuer: string;
}

export interface ISendTransactionOptions {
  network: string;
}

export type TransactionResponseType =
  // ? rpc.Api.GetSuccessfulTransactionResponse
  Horizon.HorizonApi.SubmitTransactionResponse;

export interface ISendTransaction {
  xdr: string;
  options: ISendTransactionOptions;
  rejecter: (reason: any) => void;
  result?: TransactionResponseType;
  resolver: (value: TransactionResponseType) => void;
}
