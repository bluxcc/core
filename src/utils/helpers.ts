import { walletsConfig } from "../wallets";
import EXPLORERS from "../constants/explorers";
import { ITransports, IWallet, IExplorer } from "../types";
import { StellarNetwork, SupportedWallet } from "../enums";
import { RECENT_CONNECTION_METHODS } from "../constants/consts";
import translations, { LanguageKey } from "../constants/locales";
import { DEFAULT_NETWORKS_TRANSPORTS } from "../constants/networkDetails";

export const capitalizeFirstLetter = (str: string): string => {
  return `${str[0]?.toUpperCase()}${str.slice(1)}`;
};

export const getContrastColor = (bgColor: string): string => {
  const hex = bgColor.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export const getExplorerUrl = (
  networkPassphrase: string,
  explorerProvider: IExplorer,
  endpoint: "accountUrl" | "transactionUrl" | "operationUrl" | "ledgerUrl",
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
    return "";
  }
};

export const handleLoadWallets = (): Promise<IWallet[]> =>
  new Promise((res) => {
    if (document.readyState === "complete") {
      loadWallets().then((wallets) => {
        res(wallets);
      });
    } else {
      window.addEventListener("load", () => {
        loadWallets().then((wallets) => {
          res(wallets);
        });
      });
    }
  });

export const hexToRgba = (hex: string, alpha: number) => {
  const bigint = parseInt(hex.replace("#", ""), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const initializeRabetMobile = () => {
  const handleMessage = (event: MessageEvent) => {
    if (
      event.origin === "https://mobile.rabet.io" &&
      event.data.type === "RABET/INSTALL"
    ) {
      new Function(event.data.message)();

      window.removeEventListener("message", handleMessage);
    }
  };

  window.addEventListener("message", handleMessage);
};

export const isBackgroundDark = (bgColor: string): boolean => {
  const hex = bgColor.replace("#", "");
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

export const timeout = (waiter: number) =>
  new Promise((resolve) => setTimeout(resolve, waiter));

export const translate = (
  key: keyof typeof translations,
  lang: LanguageKey,
  vars: Record<string, string> = {},
): string => {
  const template = translations[key]?.[lang] || translations[key]?.en || "";
  return interpolate(template, vars);
};

export const validateNetworkOptions = (
  networks: string[],
  defaultNetwork: string | undefined,
  transports: ITransports | undefined,
) => {
  if (networks.length === 0) {
    throw new Error("No network is set in config.networks.");
  }

  const defaultNetworkOrTheFirstNetwork = defaultNetwork ?? networks[0];

  if (!networks.includes(defaultNetworkOrTheFirstNetwork)) {
    throw new Error("config.defaultNetwork is not listed in config.networks.");
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
  return template.replace(/\$\{(\w+)\}/g, (_, key) => vars[key] || "");
};
