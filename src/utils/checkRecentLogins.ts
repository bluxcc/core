import { IWallet } from '../types';
import { BluxEvent } from './events';
import { SupportedWallet } from '../enums';
import { getWalletNetwork } from './helpers';
import { getState, setState } from '../store';

const RECENT_LOGIN_CONFIG = '__BLUX__RECENT_LOGIN_CONFIG';
const RECENT_LOGIN_WINDOW_MS = 1000 * 60 * 60;

type StoredRecentLogin = {
  authMethod: string;
  authValue: string;
  timestamp: number;
};

const getStoredRecentLogin = (): StoredRecentLogin | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = localStorage.getItem(RECENT_LOGIN_CONFIG);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredRecentLogin>;

    if (
      typeof parsed.authMethod !== 'string' ||
      typeof parsed.authValue !== 'string' ||
      typeof parsed.timestamp !== 'number'
    ) {
      return null;
    }

    return parsed as StoredRecentLogin;
  } catch {
    return null;
  }
};

const isRecentLogin = (timestamp: number) =>
  Date.now() - timestamp <= RECENT_LOGIN_WINDOW_MS;

export const setRecentLoginConfig = (
  authMethod: string,
  authValue: string,
  timestamp = Date.now(),
) => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(
    RECENT_LOGIN_CONFIG,
    JSON.stringify({
      authMethod,
      authValue,
      timestamp,
    } satisfies StoredRecentLogin),
  );
};

export const clearRecentLoginConfig = () => {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.removeItem(RECENT_LOGIN_CONFIG);
};

export const checkRecentLogins = async (): Promise<boolean> => {
  const store = getState();

  if (store.authState.isAuthenticated && !!store.user) {
    return true;
  }

  const recentLogin = getStoredRecentLogin();

  if (!recentLogin || !isRecentLogin(recentLogin.timestamp)) {
    return false;
  }

  if (recentLogin.authMethod !== 'wallet') {
    return false;
  }

  const wallet = store.wallets.find((w) => w.name === recentLogin.authValue) as
    | IWallet
    | undefined;

  if (!wallet) {
    return false;
  }

  try {
    const publicKey = await wallet.connect();

    if (!publicKey || publicKey.trim() === '') {
      return false;
    }

    setState((state) => ({
      ...state,
      user: {
        address: '',
        walletPassphrase: '',
        authMethod: 'wallet',
        authValue: wallet.name,
      },
    }));

    const passphrase = await getWalletNetwork(wallet);

    store.connectWalletSuccessful(publicKey, passphrase);
    store.setIsAuthenticated(true);

    const user = getState().user;

    if (user) {
      getState().emitter.emit(BluxEvent.LoggedIn, { user });
    }

    setRecentLoginConfig('wallet', wallet.name as SupportedWallet);

    return true;
  } catch (cause) {
    return false;
  }
};
