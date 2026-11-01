import { BluxEvent } from './events';
import { canonicalWalletName, getWalletNetwork } from './helpers';
import { getState, setState } from '../store';
import { SupportedWallet } from '../enums';
import { walletsConfig } from '../wallets';
import { apiGetUser } from './api';
import loginResolver from '../stellar/processes/loginResolver';
import {
  clearStoredSession,
  getSessionRevision,
  readStoredSession,
  writeStoredSession,
} from './sessionStorage';

const RECENT_LOGIN_WINDOW_MS_WALLETS = 1000 * 60 * 40;

export const setRecentLoginConfig = (
  authMethod: string,
  authValue: string,
  timestamp = Date.now(),
  acceptedJwt?: string,
) => {
  const state = getState();

  writeStoredSession({
    appId: state.config.appId,
    authMethod,
    authValue,
    timestamp,
    jwt:
      acceptedJwt ?? (state.auth?.isAuthenticated ? state.auth.JWT : undefined),
  });
};

export const clearRecentLoginConfig = clearStoredSession;

const restoreRecentLogin = async (): Promise<boolean> => {
  const store = getState();
  const recentLogin = readStoredSession();

  if (!recentLogin || store.auth?.JWT || store.user) return false;

  const appId = store.config.appId;

  if (recentLogin.appId !== undefined && recentLogin.appId !== appId) {
    return false;
  }

  // Old wallet-only records can still reconnect without a bearer token.
  // Unscoped tokens must not authenticate a different app on the same origin.
  const jwt = recentLogin.appId === appId ? recentLogin.jwt : undefined;
  const revision = getSessionRevision();
  const isCurrentAttempt = () => {
    const current = getState();
    const saved = readStoredSession();
    return (
      current.config.appId === appId &&
      current.auth === store.auth &&
      current.user === store.user &&
      getSessionRevision() === revision &&
      saved?.timestamp === recentLogin.timestamp &&
      saved.appId === recentLogin.appId &&
      saved.authMethod === recentLogin.authMethod &&
      saved.authValue === recentLogin.authValue &&
      saved.jwt === recentLogin.jwt
    );
  };

  try {
    let authMethod = recentLogin.authMethod;
    let authValue = recentLogin.authValue;
    let publicKey = '';
    let passphrase = getState().stellar?.activeNetwork || '';

    if (jwt) {
      // A saved token is only a candidate session. Fetch the current user and
      // let the API reject expired, invalid, or deleted-user credentials.
      const result = await apiGetUser(jwt);

      if (!isCurrentAttempt()) return false;

      if (!result?.public_key?.trim()) {
        clearStoredSession();
        return false;
      }

      authMethod = result.auth_method || authMethod;
      authValue = result.auth_value || authValue;
      // public_key is the separate Blux custodial account, even for wallet
      // logins. Only the API's verified external wallet identifies this user.
      publicKey =
        authMethod === 'wallet' ? result.wallet || '' : result.public_key;
      // An older API may omit wallet. Keep the saved session for a later retry
      // rather than signing in with the custodial account or trusting storage.
      if (!publicKey.trim()) return false;
    } else {
      const age = Date.now() - recentLogin.timestamp;

      if (
        authMethod !== 'wallet' ||
        age < 0 ||
        age > RECENT_LOGIN_WINDOW_MS_WALLETS
      ) {
        clearStoredSession();
        return false;
      }
    }

    if (authMethod === 'wallet') {
      const candidates = jwt
        ? [...getState().wallets, ...Object.values(walletsConfig)]
        : getState().wallets;
      const wallet = candidates.find(
        (w) =>
          w.name !== SupportedWallet.Api &&
          canonicalWalletName(w.name) === canonicalWalletName(authValue),
      );
      if (!wallet) return false;
      authValue = wallet.name;

      // A validated session already proves the login. Reconnecting here can
      // open a popup, require an unlock, or wait forever for WalletConnect.
      // Only legacy records without a JWT need to reconnect.
      if (!jwt) {
        const connectedAddress = await wallet.connect();
        if (!isCurrentAttempt()) return false;
        if (!connectedAddress?.trim()) return false;
        publicKey = connectedAddress;

        try {
          passphrase = (await getWalletNetwork(wallet)) || passphrase;
        } catch {
          // Use the configured network if the wallet cannot report it.
        }
      }
    }

    if (!isCurrentAttempt()) return false;

    setState((state) => ({
      ...state,
      auth: jwt ? { isAuthenticated: true, JWT: jwt } : undefined,
      user: {
        address: publicKey,
        walletPassphrase:
          authMethod === 'wallet'
            ? passphrase
            : state.stellar?.activeNetwork || '',
        authMethod,
        authValue,
      },
      loginError: undefined,
      waitingStatus: 'login',
      authState: { ...state.authState, isAuthenticated: true },
    }));

    const restored = getState();
    if (!restored.authState.isAuthenticated || !restored.user) return false;

    setRecentLoginConfig(authMethod, authValue);
    getState().closeModal();

    // Auth and modal listeners may immediately log out. Respect that choice.
    if (
      !getState().authState.isAuthenticated ||
      getState().user !== restored.user
    )
      return false;

    loginResolver();
    getState().emitter.emit(BluxEvent.LoggedIn, { user: restored.user });

    return true;
  } catch (cause) {
    const status = (cause as { status?: number })?.status;

    if (
      isCurrentAttempt() &&
      (status === 401 || status === 403 || status === 404)
    ) {
      clearStoredSession();
    }

    // Network errors and server outages must not delete a usable saved login.
    return false;
  }
};

let restoreInFlight: { appId: string; promise: Promise<boolean> } | undefined;

export const checkRecentLogins = (): Promise<boolean> => {
  const store = getState();

  if (store.authState.isAuthenticated && store.user?.address) {
    return Promise.resolve(true);
  }

  if (restoreInFlight?.appId === store.config.appId) {
    return restoreInFlight.promise;
  }

  const promise = restoreRecentLogin().finally(() => {
    if (restoreInFlight?.promise === promise) restoreInFlight = undefined;
  });

  restoreInFlight = { appId: store.config.appId, promise };
  return promise;
};
