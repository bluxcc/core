import { IWallet } from '../types';
import { BluxEvent } from './events';
import { getWalletNetwork } from './helpers';
import { getState, setState } from '../store';
import { apiGetUser } from './api';

const RECENT_LOGIN_CONFIG = '__BLUX__RECENT_LOGIN_CONFIG';
const RECENT_LOGIN_WINDOW_MS_WALLETS = 1000 * 60 * 40; // 40 minutes
const RECENT_LOGIN_WINDOW_MS_WEB2 = 1000 * 60 * 60 * 6; // 6 hours

type StoredRecentLogin = {
  authMethod: string;
  authValue: string;
  timestamp: number;
  jwt?: string;
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

const isRecentLogin = (timestamp: number, threshold: number) =>
  Date.now() - timestamp <= threshold;

export const setRecentLoginConfig = (
  authMethod: string,
  authValue: string,
  timestamp = Date.now(),
  jwt: string,
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
      jwt,
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

  if (
    !recentLogin ||
    !isRecentLogin(recentLogin.timestamp, RECENT_LOGIN_WINDOW_MS_WEB2)
  ) {
    return false;
  }

  if (recentLogin.authMethod === 'email' && recentLogin.jwt) {
    try {
      const user = await apiGetUser(recentLogin.jwt);

      setState((state) => ({
        ...state,
        user: {
          address: user.public_key,
          walletPassphrase: '',
          authMethod: 'email',
          authValue: user.auth_value,
        },
      }));

      store.connectWalletSuccessful(
        user.public_key,
        store.stellar?.activeNetwork || '',
      );
      store.setIsAuthenticated(true);

      const userStore = getState().user;

      if (userStore) {
        getState().emitter.emit(BluxEvent.LoggedIn, { user: userStore });
      }

      setRecentLoginConfig(
        'email',
        store.user?.authValue || '',
        Date.now(),
        recentLogin.jwt,
      );

      return true;
    } catch {
      return false;
    }
  }

  if (
    !recentLogin ||
    !isRecentLogin(recentLogin.timestamp, RECENT_LOGIN_WINDOW_MS_WALLETS)
  ) {
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

    let passphrase = '';

    try {
      passphrase = await getWalletNetwork(wallet);
    } catch { }

    store.connectWalletSuccessful(publicKey, passphrase);
    store.setIsAuthenticated(true);

    const user = getState().user;

    if (user) {
      getState().emitter.emit(BluxEvent.LoggedIn, { user });
    }

    setRecentLoginConfig('wallet', wallet.name, Date.now(), '');

    return true;
  } catch (cause) {
    return false;
  }
};
