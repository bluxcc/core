import { Asset, Horizon } from '@stellar/stellar-sdk';

import { XLM } from '../constants/assets';
import { walletsConfig } from '../wallets';
import EXPLORERS from '../constants/explorers';
import translations from '../constants/locales';
import { RECENT_CONNECTION_METHODS } from '../constants/consts';
import { Route, StellarNetwork, SupportedWallet } from '../enums';
import {
  IAsset,
  IWallet,
  IExplorer,
  LanguageKey,
  ITransports,
  IWalletNames,
} from '../types';
import {
  networks,
  INetworkTransports,
  DEFAULT_NETWORKS_TRANSPORTS,
} from '../constants/networkDetails';

export const bufferToBase64Url = (buf: ArrayBuffer) => {
  const bytes = new Uint8Array(buf);

  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Inverse of bufferToBase64Url. WebAuthn needs the raw bytes (e.g. the server
// challenge or a credential id) as a BufferSource, and the API encodes them as
// base64url without padding, so restore the standard base64 alphabet and padding
// before atob. Returns a concrete ArrayBuffer (a valid BufferSource).
export const base64UrlToBuffer = (value: string): ArrayBuffer => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4));
  const binary = atob(base64 + padding);

  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return buffer;
};

export const getAssetTitle = (
  asset:
    | Horizon.HorizonApi.BalanceLineNative
    | Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum4'>
    | Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum12'>
    | Horizon.HorizonApi.BalanceLineLiquidityPool,
): string => {
  if (asset.asset_type === 'native') {
    return 'XLM';
  }

  if (
    asset.asset_type === 'credit_alphanum4' ||
    asset.asset_type === 'credit_alphanum12'
  ) {
    return asset.asset_code;
  }

  if (asset.asset_type === 'liquidity_pool_shares') {
    return 'Liquidity Pool';
  }

  return '';
};

export const getAssetSubtitle = (
  asset:
    | Horizon.HorizonApi.BalanceLineNative
    | Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum4'>
    | Horizon.HorizonApi.BalanceLineAsset<'credit_alphanum12'>
    | Horizon.HorizonApi.BalanceLineLiquidityPool,
): string => {
  if (asset.asset_type === 'native') {
    return 'native';
  }

  if (
    asset.asset_type === 'credit_alphanum4' ||
    asset.asset_type === 'credit_alphanum12'
  ) {
    return shortenAddress(asset.asset_issuer, 4);
  }

  if (asset.asset_type === 'liquidity_pool_shares') {
    return shortenAddress(asset.liquidity_pool_id, 4);
  }

  return '';
};

export const iAssetToAsset = (asset: IAsset): Asset => {
  if (asset.assetType === 'native') {
    return Asset.native();
  }

  return new Asset(asset.assetCode, asset.assetIssuer);
};

export const addXLMToBalances = (balances: IAsset[]) => {
  if (balances.length !== 0) {
    return balances;
  }

  return [XLM];
};

export const fetcher = async <T>(url: string, options: RequestInit) => {
  const response = await fetch(url, options);

  // Error responses don't always carry a JSON body; parsing one unconditionally
  // would throw a SyntaxError that masks the real HTTP status. Fall back to an
  // empty object so callers still see the status code.
  let result: Record<string, unknown> = {};
  try {
    result = await response.json();
  } catch (_) {
    result = {};
  }

  const returnValue = {
    status: response.status,
    ...result,
  } as T;

  return returnValue;
};

export const isChangeTrustNeeded = (
  to: string,
  asset: IAsset,
  balances: Horizon.HorizonApi.BalanceLine[],
) => {
  let foundAsset = balances.find((x) => x.asset_type === 'native');

  if (asset.assetType !== 'native') {
    // @ts-ignore
    foundAsset = balances.find(
      (x) =>
        x.asset_type === asset.assetType &&
        // @ts-ignore
        x.asset_code === asset.assetCode &&
        // @ts-ignore
        x.asset_issuer === asset.assetIssuer,
    );
  }

  if (!foundAsset) {
    return true;
  }

  // @ts-ignore
  if (Number(foundAsset.balance) + Number(to) >= Number(foundAsset.limit)) {
    return true;
  }

  return false;
};

// Resolves an asset's balance from the CURRENT balances instead of the
// snapshot stored when the asset was picked. Assets absent from the active
// network's balances (e.g. suggested assets) resolve to '0'.
export const getLiveAssetBalance = (
  asset: IAsset,
  balances: Horizon.HorizonApi.BalanceLine[],
): string => {
  const line = balances.find((b) =>
    asset.assetType === 'native'
      ? b.asset_type === 'native'
      : // @ts-ignore
      b.asset_code === asset.assetCode &&
      // @ts-ignore
      b.asset_issuer === asset.assetIssuer,
  );

  return line?.balance || '0';
};

const STROOPS_PER_UNIT = 10000000; // 1 XLM (and every asset unit) = 10^7 stroops
const BASE_RESERVE_STROOPS = 5000000; // 0.5 XLM reserved per ledger entry
// Every account permanently locks two base reserves (1 XLM) for its own entry.
const BASE_ENTRY_COUNT = 2;
// The fee is paid in XLM, so the native max keeps a buffer back to cover it.
// 100000 stroops = 0.01 XLM, comfortably above a single operation's fee.
const FEE_BUFFER_STROOPS = 100000;

// The slice of the account needed to compute the XLM minimum balance. Loaded
// once per account rather than read from a balance line, which doesn't carry it.
export interface IReserveInfo {
  subentryCount: number;
  numSponsoring: number;
  numSponsored: number;
}

// Parses a Stellar decimal amount ("123.4567890") into an integer number of
// stroops so the reserve math never drifts on floating point. Extra precision
// is truncated, which keeps the resulting max on the safe (lower) side.
const amountToStroops = (amount: string): number => {
  if (!amount) {
    return 0;
  }

  const negative = amount.trim().startsWith('-');
  const [whole, fraction = ''] = amount.replace('-', '').split('.');
  const paddedFraction = (fraction + '0000000').slice(0, 7);

  const stroops =
    Number(whole || '0') * STROOPS_PER_UNIT + Number(paddedFraction);

  return negative ? -stroops : stroops;
};

// Formats an integer stroop amount back into a trimmed decimal string.
const stroopsToAmount = (stroops: number): string => {
  const rounded = Math.round(stroops);
  const negative = rounded < 0;
  const abs = Math.abs(rounded);

  const whole = Math.floor(abs / STROOPS_PER_UNIT);
  const fraction = (abs % STROOPS_PER_UNIT)
    .toString()
    .padStart(7, '0')
    .replace(/0+$/, '');

  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
};

// Maximum amount of `asset` the account can actually send. For every asset the
// balance committed to open offers (selling liabilities) is subtracted. XLM
// additionally has to keep its minimum balance —
// (2 + subentry_count + num_sponsoring − num_sponsored) × 0.5 XLM, which already
// accounts for trustlines, offers, data entries and extra signers — plus a
// buffer for the transaction fee. Buying liabilities cap how much can be
// received, not sent, so they are intentionally left out. `reserve` is null
// until the account has loaded; the native max stays optimistic until then.
export const getMaxSpendableAmount = (
  asset: IAsset,
  balances: Horizon.HorizonApi.BalanceLine[],
  reserve: IReserveInfo | null,
): string => {
  const line = balances.find((b) =>
    asset.assetType === 'native'
      ? b.asset_type === 'native'
      : // @ts-ignore - liquidity pool lines carry no asset_code/asset_issuer
      b.asset_code === asset.assetCode &&
      // @ts-ignore
      b.asset_issuer === asset.assetIssuer,
  );

  if (!line) {
    return '0';
  }

  const sellingLiabilities =
    'selling_liabilities' in line ? line.selling_liabilities : '0';

  let available =
    amountToStroops(line.balance) - amountToStroops(sellingLiabilities);

  if (asset.assetType === 'native') {
    if (reserve) {
      const entryCount =
        BASE_ENTRY_COUNT +
        reserve.subentryCount +
        reserve.numSponsoring -
        reserve.numSponsored;

      available -= entryCount * BASE_RESERVE_STROOPS + FEE_BUFFER_STROOPS;
    } else {
      // Reserve structure not loaded yet; only the fee buffer is known for sure.
      available -= FEE_BUFFER_STROOPS;
    }
  }

  return available > 0 ? stroopsToAmount(available) : '0';
};

export const balanceToAsset = (
  balance: Horizon.HorizonApi.BalanceLine,
): IAsset => {
  // todo: set a real value in currency and also set the right logo for each asset.
  const ast: Partial<IAsset> = {
    valueInCurrency: '0',
    assetBalance: balance.balance || '0',
    assetType: balance.asset_type,
  };

  if (balance.asset_type === 'native') {
    ast.assetCode = 'XLM';
    ast.assetIssuer = '';
  } else if (balance.asset_type === 'liquidity_pool_shares') {
    ast.assetCode = 'LiquidtyPool';
    ast.assetIssuer = '';
  } else {
    ast.assetCode = balance.asset_code;
    ast.assetIssuer = balance.asset_issuer;
  }

  return ast as IAsset;
};

export const capitalizeFirstLetter = (str: string): string => {
  return `${str[0]?.toUpperCase()}${str.slice(1)}`;
};

export const copyText = (text: string) => {
  return navigator.clipboard.writeText(text);
};

export const decideBackRouteFromSelectAsset = (
  field: 'send' | 'swapTo' | 'swapFrom',
) => {
  if (field === 'send') {
    return Route.SEND;
  }

  return Route.SWAP;
};

export const formatDate = (isoString: string) => {
  const date = new Date(isoString);

  const day = date.getUTCDate();
  const month = date.toLocaleString('en-US', { month: 'short' });

  return `${day} ${month}`;
};

export const getActiveNetworkTitle = (activeNetwork: string): string => {
  const networksArray = Object.entries(networks);
  const selectedNetwork = networksArray.find((n) => n[1] === activeNetwork);

  let networkName = '';

  if (!selectedNetwork) {
    networkName = 'MAINNET';
  } else {
    networkName = selectedNetwork[0].toUpperCase();
  }

  return networkName;
};

export const getContrastColor = (bgColor: string): string => {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

export const getExplorerUrl = (
  networkPassphrase: string,
  explorerProvider: IExplorer,
  endpoint: 'accountUrl' | 'transactionUrl' | 'operationUrl' | 'ledgerUrl',
  value: string,
): string | null => {
  let explorer = EXPLORERS[explorerProvider];

  if (!explorer) {
    explorer = EXPLORERS.stellarchain;
  }

  let networkExplorer = explorer[networkPassphrase];

  if (!networkExplorer) {
    return null;
  }

  return `${networkExplorer}/${explorer[endpoint]}/${value}`;
};

export const getMappedWallets = async (
  walletNames: IWalletNames,
): Promise<IWallet[]> => {
  const checkedWallets = await Promise.all(
    Object.values(walletsConfig).map(async (wallet) => {
      try {
        if (
          // @ts-ignore
          walletNames.includes(wallet.name.toLowerCase().replace(/\s+/g, ''))
        ) {
          return { wallet, isAvailable: false };
        }

        const isAvailable = await wallet.isAvailable();

        return { wallet, isAvailable };
      } catch (_) {
        return { wallet, isAvailable: false };
      }
    }),
  );

  const availableWallets = checkedWallets.filter((w) => !!w.isAvailable);

  return availableWallets.map((w) => w.wallet);
};

export const getRecentConnectionMethod = () => {
  const walletName = localStorage.getItem(RECENT_CONNECTION_METHODS);

  if (!walletName) {
    return [];
  }

  try {
    const result = JSON.parse(walletName) as SupportedWallet[];

    return result;
  } catch (_) {
    return [];
  }
};

export const getNetworkByPassphrase = (passphrase: string) => {
  const networkEntry = Object.entries(StellarNetwork).find(
    ([, value]) => value === passphrase,
  );

  if (!networkEntry) {
    throw new Error(`BLUX: Unknown network passphrase: ${passphrase}`);
  }

  return networkEntry[0].toLowerCase();
};

export const getNetworkRpc = (
  network: string,
  transports: ITransports,
): INetworkTransports => {
  let details = DEFAULT_NETWORKS_TRANSPORTS[network];

  const transport = transports[network];

  if (!details && !transport) {
    throw new Error('BLUX: Custom network has no transports.');
  } else if (!details && transport) {
    details = {
      name: 'Custom Network',
      horizon: '',
      soroban: '',
    };
  }

  if (transport) {
    if (transport.horizon) {
      details.horizon = transport.horizon;
    }

    if (transport.soroban) {
      details.soroban = transport.soroban;
    }
  }

  return details;
};

export const canonicalWalletName = (name: string) =>
  name.toLowerCase().replace(/\s+/g, '');

// Display order: recently used wallets first (most recent on top), then the
// dev-prioritized ones from config.orderWallets, then everything else in the
// default order.
export const getSortedCheckedWallets = (
  wallets: IWallet[],
  priorityNames: string[] = [],
): IWallet[] => {
  const recentNames = getRecentConnectionMethod();

  const walletMap = new Map(wallets.map((w) => [w.name, w]));
  const recentWallets: IWallet[] = [];
  const seen = new Set<string>();

  for (const name of recentNames) {
    const wallet = walletMap.get(name);

    if (wallet) {
      recentWallets.push(wallet);
      seen.add(name);
    }
  }

  const priorityWallets: IWallet[] = [];

  for (const priorityName of priorityNames) {
    const wallet = wallets.find(
      (w) => canonicalWalletName(w.name) === canonicalWalletName(priorityName),
    );

    if (wallet && !seen.has(wallet.name)) {
      priorityWallets.push(wallet);
      seen.add(wallet.name);
    }
  }

  const remainingWallets = wallets.filter((w) => !seen.has(w.name));

  const result = [...recentWallets, ...priorityWallets, ...remainingWallets];

  const walletsWithIsRecent = result.map((w, i) => {
    return {
      ...w,
      isRecent: i === 0 && recentWallets.length > 0,
    };
  });

  return walletsWithIsRecent;
};

export const getWalletNetwork = async (wallet: IWallet) => {
  try {
    const { passphrase } = await wallet.getNetwork();

    return passphrase;
  } catch (e) {
    return '';
  }
};

export const handleLoadWallets = (
  walletNames: IWalletNames,
  orderWallets: string[] = [],
): Promise<IWallet[]> =>
  new Promise((res) => {
    if (document.readyState === 'complete') {
      loadWallets(walletNames, orderWallets).then((wallets) => {
        res(wallets);
      });
    } else {
      window.addEventListener('load', () => {
        loadWallets(walletNames, orderWallets).then((wallets) => {
          res(wallets);
        });
      });
    }
  });

export const hexToRgba = (hex: string, alpha: number = 1) => {
  hex = hex.replace(/^#/, '');
  let r: number, g: number, b: number;

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
  } else if (hex.length === 6 || hex.length === 8) {
    r = parseInt(hex.substring(0, 2), 16);
    g = parseInt(hex.substring(2, 4), 16);
    b = parseInt(hex.substring(4, 6), 16);
  } else {
    throw new Error(`BLUX: Invalid hex color: ${hex}`);
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const humanizeAmount = (
  amount: number | string,
  big: boolean = false,
): string => {
  const num = typeof amount === 'number' ? amount : parseFloat(amount);

  if (isNaN(num) || num === 0) return '0';
  if (num < 0.000001) return amount.toString();

  if (big) {
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}m`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}k`;
  }

  return formatNumberWithCommas(sevenDigit(num));
};

// Formats a USD value (as produced by the order-book pricing) for display.
// Non-finite or non-positive inputs render as a plain '$0.00', and amounts
// below a cent collapse to '<$0.01' so dust never shows as a misleading $0.00.
export const formatUsd = (value: number | string): string => {
  const num = typeof value === 'number' ? value : parseFloat(value);

  if (!isFinite(num) || isNaN(num) || num <= 0) {
    return '$0.00';
  }

  if (num < 0.01) {
    return '<$0.01';
  }

  return `$${num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const initializeRabetMobile = () => {
  const handleMessage = (event: MessageEvent) => {
    if (
      event.origin === 'https://mobile.rabet.io' &&
      event.data.type === 'RABET/INSTALL'
    ) {
      new Function(event.data.message)();

      window.removeEventListener('message', handleMessage);
    }
  };

  window.addEventListener('message', handleMessage);
};

export const isBackgroundDark = (bgColor: string): boolean => {
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? false : true;
};

export const loadWallets = async (
  excludedWallets: IWalletNames,
  orderWallets: string[] = [],
) => {
  initializeRabetMobile();

  const wallets = await getMappedWallets(excludedWallets);

  const sortAvailableWallets = getSortedCheckedWallets(wallets, orderWallets);

  return sortAvailableWallets;
};

export const setRecentConnectionMethod = (walletName: SupportedWallet) => {
  const recentMethods = getRecentConnectionMethod();

  const newRecent = [
    walletName,
    ...recentMethods.filter((x) => x !== walletName),
  ];

  localStorage.setItem(RECENT_CONNECTION_METHODS, JSON.stringify(newRecent));
};

export const shortenAddress = (address: string, numChars = 8) => {
  const shortenedAddress =
    address.slice(0, numChars) + '...' + address.slice(-numChars);

  return shortenedAddress;
};

export const timeout = (waiter: number) =>
  new Promise((resolve) => setTimeout(resolve, waiter));

export const toTitleFormat = (str: string) => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const translate = (
  key: keyof typeof translations,
  lang: LanguageKey,
  vars: Record<string, string> = {},
): string => {
  // Fall back to English, then to the key itself so dynamic titles (e.g. an
  // asset code in the modal header) pass through unchanged.
  const template =
    translations[key]?.[lang] || translations[key]?.en || String(key);
  return interpolate(template, vars);
};

export const getNetworkNamesFromPassphrase = (
  userNetworks: string[],
): string[] => {
  const result = Object.entries(networks)
    .filter((n) => userNetworks.includes(n[1]))
    .map((n) => capitalizeFirstLetter(n[0]));

  return result;
};

// Normalizes config.orderWallets to canonical names (lowercase, no spaces)
// and drops unknown entries with a warning.
export const validateOrderWallets = (
  orderWallets: string[] | undefined,
): string[] => {
  if (!orderWallets) {
    return [];
  }

  if (!Array.isArray(orderWallets)) {
    throw new Error(
      'BLUX: config.orderWallets must be an array of wallet names.',
    );
  }

  const knownNames = new Set(
    Object.values(SupportedWallet).map((name) => canonicalWalletName(name)),
  );

  const result: string[] = [];

  for (const name of orderWallets) {
    const canonical = canonicalWalletName(String(name));

    if (!knownNames.has(canonical)) {
      console.warn(`BLUX: unknown wallet '${name}' in config.orderWallets.`);

      continue;
    }

    if (!result.includes(canonical)) {
      result.push(canonical);
    }
  }

  return result;
};

export const validateNetworkOptions = (
  networks: string[],
  defaultNetwork: string | undefined,
  transports: ITransports | undefined,
) => {
  if (!networks || networks.length === 0) {
    throw new Error('BLUX: No network is set in config.networks.');
  }

  const defaultNetworkOrTheFirstNetwork = defaultNetwork ?? networks[0];

  if (!networks.includes(defaultNetworkOrTheFirstNetwork)) {
    throw new Error(
      'BLUX: config.defaultNetwork is not listed in config.networks.',
    );
  }

  for (const n of networks) {
    if (!DEFAULT_NETWORKS_TRANSPORTS[n]) {
      if (!transports || !transports[n]) {
        throw new Error(`BLUX: Must set transports for custom network ${n}`);
      }
    }
  }
};

const interpolate = (template: string, vars: Record<string, string> = {}) => {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] || '');
};

const sevenDigit = (number: number | string): string => {
  const numStr = number.toString();
  const [integer, decimal = ''] = numStr.split('.');

  if (!decimal) return integer;

  const precisionMap: Record<number, number> = {
    0: 8,
    1: 7,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
  };

  const precision = precisionMap[integer.length] ?? 0;

  if (precision > 0) {
    const sliced = `${integer}.${decimal.slice(0, precision)}`;
    const num = parseFloat(sliced);
    return Number.isInteger(num) ? integer : num.toFixed(2);
  }

  return integer;
};

const formatNumberWithCommas = (number: string): string => {
  const [integer, decimal] = number.split('.');
  return decimal
    ? `${integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${decimal}`
    : integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const validateInput = (type: string, value: string) => {
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  return value.trim() !== '';
};
