import { walletsConfig } from "./wallets";
import { ITransports, IWallet, StellarNetwork, SupportedWallet } from "./types";
import { RECENT_CONNECTION_METHODS } from "./constants/storageKeys";
import { DEFAULT_NETWORKS_TRANSPORTS } from "./constants/networkDetails";

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

export const setRecentConnectionMethod = (walletName: SupportedWallet) => {
  const recentMethods = getRecentConnectionMethod();

  const newRecent = [
    walletName,
    ...recentMethods.filter((x) => x !== walletName),
  ];

  localStorage.setItem(RECENT_CONNECTION_METHODS, JSON.stringify(newRecent));
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

export const timeout = (waiter: number) =>
  new Promise((resolve) => setTimeout(resolve, waiter));

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

export const getNetworkByPassphrase = (passphrase: string) => {
  const networkEntry = Object.entries(StellarNetwork).find(
    ([, value]) => value === passphrase,
  );

  if (!networkEntry) {
    throw new Error(`Unknown network passphrase: ${passphrase}`);
  }

  return networkEntry[0].toLowerCase();
};
