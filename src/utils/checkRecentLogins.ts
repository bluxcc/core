import { IWallet } from '../types';
import { BluxEvent } from './events';
import { getWalletNetwork } from './helpers';
import { getState, setState } from '../store';
import { clearLegacyJwtStorage } from './sessionJwt';

const RECENT_LOGIN_CONFIG = '__BLUX__RECENT_LOGIN_CONFIG';
const RECENT_LOGIN_WINDOW_MS_WALLETS = 1000 * 60 * 40; // 40 minutes

type StoredRecentLogin = {
  authMethod: string;
  authValue: string;
  timestamp: number;
};

const writeRecentLogin = (value: StoredRecentLogin) => {
  localStorage.setItem(RECENT_LOGIN_CONFIG, JSON.stringify(value));
};

/**
 * Drops bearer tokens left in recent-login storage by older SDK versions.
 * Wallet reconnect records are kept, without the token. Email, social, and
 * passkey records are removed: they only existed to replay that token.
 */
export const scrubStoredBearerTokens = (): void => {
  clearLegacyJwtStorage();

  if (typeof window === 'undefined') {
    return;
  }

  const rawValue = localStorage.getItem(RECENT_LOGIN_CONFIG);

  if (!rawValue) {
    return;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredRecentLogin> & {
      jwt?: unknown;
    };

    if (parsed.authMethod !== 'wallet') {
      localStorage.removeItem(RECENT_LOGIN_CONFIG);
      return;
    }

    if (!('jwt' in parsed)) {
      return;
    }

    if (
      typeof parsed.authValue !== 'string' ||
      typeof parsed.timestamp !== 'number'
    ) {
      localStorage.removeItem(RECENT_LOGIN_CONFIG);
      return;
    }

    writeRecentLogin({
      authMethod: 'wallet',
      authValue: parsed.authValue,
      timestamp: parsed.timestamp,
    });
  } catch {
    localStorage.removeItem(RECENT_LOGIN_CONFIG);
  }
};

const getStoredRecentLogin = (): StoredRecentLogin | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  scrubStoredBearerTokens();

  const rawValue = localStorage.getItem(RECENT_LOGIN_CONFIG);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as Partial<StoredRecentLogin>;

    if (
      parsed.authMethod !== 'wallet' ||
      typeof parsed.authValue !== 'string' ||
      typeof parsed.timestamp !== 'number'
    ) {
      return null;
    }

    return {
      authMethod: parsed.authMethod,
      authValue: parsed.authValue,
      timestamp: parsed.timestamp,
    };
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
) => {
  if (typeof window === 'undefined' || authMethod !== 'wallet') {
    return;
  }

  writeRecentLogin({
    authMethod,
    authValue,
    timestamp,
  });
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

  // Only wallet reconnect is restored. Email, social, and passkey sessions
  // are bearer-token sessions and are not written to storage.
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

    setRecentLoginConfig('wallet', wallet.name, Date.now());

    return true;
  } catch (cause) {
    return false;
  }
};
