import type { ReactNode } from 'react';
import { Horizon, rpc } from '@stellar/stellar-sdk';

import { SupportedWallet } from './enums';

/** Supported UI language codes (ISO 639-1). */
export type LanguageKey =
  | 'en'
  | 'es'
  | 'pt'
  | 'fr'
  | 'de'
  | 'ru'
  | 'zh'
  | 'ja'
  | 'ko'
  | 'tr';

/** Custom RPC endpoints keyed by network passphrase. */
export type ITransports = Record<string, IServers>;

/** A value TypeScript still treats as a string, while keeping literal unions suggestable. */
type LooseString = string & {};

/** Block explorer used to build account/transaction links. */
export type IExplorer =
  | 'steexp'
  | 'stellarchain'
  | 'stellarexpert'
  | 'lumenscan';

/** Social login providers supported by Blux. */
export type ISocialProvider =
  | 'google'
  | 'apple'
  | 'discord'
  | 'telegram'
  | 'meta'
  | 'github'
  | 'farcaster'
  | 'tiktok'
  | 'linkedin'
  | 'whatsapp'
  | 'twitch'
  | 'kick'
  | 'spotify'
  | 'instagram'
  | 'microsoft'
  | 'gitlab'
  | 'twitter'
  | 'steam';

/** Login methods to offer in the modal. */
export type ILoginMethods = Array<
  'wallet' | 'sms' | 'email' | 'passkey' | ISocialProvider
>;

/** Canonical names of the wallets Blux can integrate with. */
export type IWalletNames = Array<
  | 'rabet'
  | 'albedo'
  | 'freighter'
  | 'xbull'
  | 'lobstr'
  | 'hana'
  | 'hot'
  | 'klever'
  | 'cactuslink'
  | 'fordefi'
  | 'trezor'
>;

/** RPC endpoints for a single network. */
export interface IServers {
  /** Horizon base URL. */
  horizon: string;
  /** Soroban RPC base URL. */
  soroban: string;
}

/** WalletConnect project metadata shown to users during pairing. */
export interface IWalletConnectMetaData {
  /** Icon URLs for your app. */
  icons: string[];
  /** Your app URL. */
  url: string;
  /** WalletConnect Cloud project id. */
  projectId: string;
  /** Short description of your app. */
  description: string;
}

/** Trezor Connect manifest metadata. */
export interface ITrezorMetaData {
  /** Contact email required by Trezor Connect. */
  email: string;
  /** Optional app URL for the Trezor manifest. */
  appUrl?: string;
}

/** Configuration passed to {@link createConfig}. */
export interface IConfig {
  /** Your Blux app id, from the Blux dashboard. Required for email/SMS/passkey/social login. */
  appId: string;
  /** Display name of your app, shown in wallet prompts and UI. */
  appName: string;
  /** Network passphrases your app supports (e.g. from {@link networks}). */
  networks: string[];
  /** Which of `networks` to start on. Defaults to the first entry. */
  defaultNetwork?: string;
  /** Theme overrides for the Blux UI. */
  appearance?: Partial<IAppearance>;
  /** UI language. Defaults to `'en'`. */
  lang?: LanguageKey;
  /** Block explorer used for links. Defaults to `'stellarchain'`. */
  explorer?: IExplorer;
  /** Persist the session across page reloads. Defaults to `false` and should remain `false` in most scenarios. */
  isPersistent?: boolean;
  /** Show Blux's built-in signing/approval UIs. When `false`, signing happens headlessly. Defaults to `true`. */
  showWalletUIs?: boolean;
  /** Login methods to offer. Defaults to `['wallet']`. `'sms'` is shown only when `/auth/validate` reports a paid plan. */
  loginMethods?: Array<ILoginMethods[number] | LooseString>;
  /** Custom Horizon/Soroban endpoints per network; required for custom networks. */
  transports?: ITransports;
  /** Wallets to hide from the picker. */
  excludeWallets?: IWalletNames;
  /** Wallets to surface first in the picker, in the given order. */
  orderWallets?: Array<IWalletNames[number] | LooseString>;
  /** WalletConnect metadata; required to enable WalletConnect. */
  walletConnect?: IWalletConnectMetaData;
  /** Trezor manifest metadata; required to enable Trezor. */
  trezor?: ITrezorMetaData;
  /** Show a modal when the connected wallet is on a network outside `networks`. Opt-in — defaults to `false`. */
  promptOnWrongNetwork?: boolean;
}

export interface IInternalConfig extends IConfig {
  explorer: IExplorer;
  appearance: IAppearance;
  loginMethods: ILoginMethods | string[];
  showWalletUIs: boolean;
  defaultNetwork: string;
  lang: LanguageKey;
  excludeWallets: IWalletNames;
  orderWallets?: string[];
  promptOnWrongNetwork: boolean;
}

/** Theme tokens for the Blux modal and components. */
export interface IAppearance {
  /** Modal or component background color/image. */
  background: string;
  /** Background color for input fields or UI sections. */
  fieldBackground: string;
  /** Primary accent or highlight color. */
  accentColor: string;
  /** Main text color. */
  textColor: string;
  /** Font family or style. */
  fontFamily: string;
  /** Outline width (e.g. `'2px'`); falls back to `borderWidth`. */
  outlineWidth?: string;
  /** Outline color; falls back to `borderColor`. */
  outlineColor?: string;
  /** Modal corner radius; falls back to `borderRadius`. */
  outlineRadius?: string;
  /** Corner radius for UI elements. */
  borderRadius: string;
  /** Border color for elements. */
  borderColor: string;
  /** Border width (e.g. `'1px'`, `'0'`). */
  borderWidth: string;
  /** App logo URL. */
  logo: string;
  /** Blur level for the backdrop (e.g. `'8px'`). */
  backdropBlur: string;
  /** Backdrop color behind the modal/overlay. */
  backdropColor: string;
  /** Box shadow style for the modal. */
  boxShadow: string;
}

/** How a wallet proves it controls an address during login. */
export type WalletProofType = 'signed_transaction' | 'signed_message';

export interface IWallet {
  name: SupportedWallet;
  website: string;
  /**
   * When true, login proves ownership with `signMessage` (SEP-53) instead of a
   * SEP-10 challenge transaction. Use this for wallets that treat the
   * unsubmittable challenge as a real payment and block on insufficient XLM
   * (Freighter, Hana, Rabet, OneKey). Hardware wallets that cannot sign arbitrary messages
   * must leave this unset so they keep using the challenge transaction.
   */
  authenticateWithSignedMessage?: boolean;
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
      network?: string;
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
  logo?: string | ReactNode;
  valueInCurrency?: string;
  assetBalance: string;
  assetCode: string;
  assetType: string;
  assetIssuer: string;
}

/**
 * Display metadata for a single asset, sourced from curated SEP-42 asset lists
 * (Lobstr, StellarExpert, Soroswap) and served as a gzipped blob from R2.
 */
export interface IAssetMeta {
  code: string;
  issuer: string | null;
  contract: string | null;
  name: string;
  org: string | null;
  domain: string | null;
  /** HTTPS (or IPFS gateway) URL of the asset logo. */
  icon: string;
  decimals: number;
  /** Which curated list this entry came from. */
  source: string;
}

/** Asset metadata keyed by `${network}:${code}:${issuer}` (e.g. `pubnet:USDC:GA5Z...`). */
export type AssetMetaMap = Record<string, IAssetMeta>;

/**
 * A custom Stellar Asset Contract (SAC) / SEP-41 token the user added to their
 * preferred list. The id/contract/name/symbol/decimals come from the Blux API
 * (`TokenView`); `balance` is read on-chain for the logged-in account (the API
 * does not store balances). The API only buckets tokens by `mainnet`/`testnet`.
 */
export interface ICustomToken {
  /** Server-side id, used for the DELETE route. */
  id: number;
  /** Token contract id (`C...`). */
  contractAddress: string;
  /** API network bucket this token belongs to. */
  network: 'mainnet' | 'testnet';
  name: string;
  symbol: string;
  decimals: number;
  /** Human-readable on-chain balance for the logged-in account; `'0'` until read. */
  balance: string;
}

/** Custom tokens grouped by the two network buckets the Blux API supports. */
export interface ICustomTokens {
  mainnet: ICustomToken[];
  testnet: ICustomToken[];
}

export interface ISignOptions {
  network: string;
}

/**
 * Lazily resolves to the value the invoked contract function returned, decoded
 * to a native JS value. Resolves to `null` for classic transactions and for
 * Soroban calls whose function returns nothing.
 */
export type TransactionReturnValue = () => Promise<unknown>;

/** A transaction that has been submitted to (and accepted by) the network. */
export interface ISubmittedTransaction {
  /** The transaction hash. */
  hash: string;
  /** Resolves the invoked contract function's return value; see {@link TransactionReturnValue}. */
  returnValue: TransactionReturnValue;
  /**
   * The underlying response: a Horizon submit response for classic
   * transactions, or the finalized Soroban RPC transaction for contract calls.
   */
  raw:
    | Horizon.HorizonApi.SubmitTransactionResponse
    | rpc.Api.GetSuccessfulTransactionResponse;
}

/** Result of a sign-and-send: the submitted transaction, or the signed XDR when not submitting. */
export type SendTransactionResult = ISubmittedTransaction | string;

export interface ISendTransaction {
  xdr: string;
  shouldSubmit: boolean;
  options: ISignOptions;
  result?: SendTransactionResult;
  rejecter: (reason: any) => void;
  resolver: (value: SendTransactionResult) => void;
}

export interface ISignMessage {
  message: string;
  result?: string;
  rejecter: (reason: any) => void;
  resolver: (value: string) => void;
}

export interface ISignAuthEntry {
  result?: string;
  authEntry: string;
  options: ISignOptions;
  rejecter: (reason: any) => void;
  resolver: (value: string) => void;
}

// Public info about a provider the project owner enabled in the dashboard.
// All OAuth credentials (client id, secret, redirect URI) stay on the backend;
// the kit never sees them.
export interface ISocialConfigEntry {
  provider: string;
  displayName: string;
  /** Login mechanism from /auth/validate: oauth2, steam, farcaster, or telegram. */
  kind?: string;
  /** Telegram bot username the on-page widget needs; empty for other providers. */
  publicId?: string;
  /** Telegram Mini App / in-app login is enabled for this project. */
  miniApps?: boolean;
}

export interface AuthenticateApiResponse {
  isValid: boolean;
  message: string;
  privacyPolicy: string;
  terms: string;
  socials: string[];
  socialsConfig: ISocialConfigEntry[];
  /** Entitled billing plan of the account that owns this app. */
  plan: string;
  /** True when the account is on a paid plan and may offer SMS login. */
  smsEnabled: boolean;
}
