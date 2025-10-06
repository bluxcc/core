import { Horizon } from '@stellar/stellar-sdk';

import { walletsConfig } from '../wallets';
import EXPLORERS from '../constants/explorers';
import translations from '../constants/locales';
import { RECENT_CONNECTION_METHODS } from '../constants/consts';
import { Route, StellarNetwork, SupportedWallet } from '../enums';
import { ITransports, IWallet, IExplorer, LanguageKey, IAsset } from '../types';
import {
  networks,
  INetworkTransports,
  DEFAULT_NETWORKS_TRANSPORTS,
} from '../constants/networkDetails';
import { XLM } from '../constants/assets';

export const addXLMToBalances = (balances: IAsset[]) => {
  if (balances.length !== 0) {
    return balances;
  }

  return [XLM];
};

export const balanceToAsset = (
  balance: Horizon.HorizonApi.BalanceLine,
): IAsset => {
  // todo: set a real value in currency and also set the right logo for each asset.
  const ast: Partial<IAsset> = {
    valueInCurrency: '0',
    assetBalance: balance.balance,
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
  const month = date.toLocaleString('en-US', { month: 'long' });

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

export const getMappedWallets = async (): Promise<IWallet[]> => {
  const checkedWallets = await Promise.all(
    Object.values(walletsConfig).map(async (wallet) => {
      try {
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
    throw new Error(`Unknown network passphrase: ${passphrase}`);
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
    throw new Error('Custom network has no transports.');
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

export const getSortedCheckedWallets = (wallets: IWallet[]): IWallet[] => {
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

  const remainingWallets = wallets.filter((w) => !seen.has(w.name));

  const result = [...recentWallets, ...remainingWallets];

  const walletsWithIsRecent = result.map((w, i) => {
    return {
      ...w,
      isRecent: i === 0,
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

export const handleLoadWallets = (): Promise<IWallet[]> =>
  new Promise((res) => {
    if (document.readyState === 'complete') {
      loadWallets().then((wallets) => {
        res(wallets);
      });
    } else {
      window.addEventListener('load', () => {
        loadWallets().then((wallets) => {
          res(wallets);
        });
      });
    }
  });

export const hexToRgba = (hex: string, alpha: number) => {
  const bigint = parseInt(hex.replace('#', ''), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
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

export const loadWallets = async () => {
  initializeRabetMobile();

  await timeout(150);

  const wallets = await getMappedWallets();
  const sortAvailableWallets = getSortedCheckedWallets(wallets);

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
  const template = translations[key]?.[lang] || translations[key]?.en || '';
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

export const validateNetworkOptions = (
  networks: string[],
  defaultNetwork: string | undefined,
  transports: ITransports | undefined,
) => {
  if (networks.length === 0) {
    throw new Error('No network is set in config.networks.');
  }

  const defaultNetworkOrTheFirstNetwork = defaultNetwork ?? networks[0];

  if (!networks.includes(defaultNetworkOrTheFirstNetwork)) {
    throw new Error('config.defaultNetwork is not listed in config.networks.');
  }

  for (const n of networks) {
    if (!DEFAULT_NETWORKS_TRANSPORTS[n]) {
      if (!transports || !transports[n]) {
        throw new Error(`Must set transports for custom network ${n}`);
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
