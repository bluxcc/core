import { apiGetUser } from '../../utils/api';
import { getState, IUser, setState } from '../../store';

/**
 * Loads the user for a freshly issued session JWT and writes them into the
 * store without persisting the session. Callers then either show the terms /
 * success UI ({@link continueLoginProcess}) or persist immediately
 * ({@link completeLoginProcess}) for headless / whitelabel logins.
 */
export const hydrateUserFromJwt = async (
  jwt: string,
  authMethod: string,
  authValue?: string,
): Promise<IUser> => {
  const store = getState();

  store.setAuth({
    isAuthenticated: false,
    JWT: jwt,
  });

  const result = await apiGetUser(jwt);
  const passphrase = store.stellar?.activeNetwork || '';

  setState((state) => ({
    ...state,
    loginError: undefined,
    waitingStatus: 'login',
    user: {
      address: result.public_key,
      walletPassphrase: passphrase,
      authMethod: result.auth_method || authMethod,
      authValue: result.auth_value || authValue || '',
    },
  }));

  store.connectWalletSuccessful(result.public_key, passphrase);

  const user = getState().user;

  if (!user?.address) {
    throw new Error('BLUX: Failed to login!');
  }

  return user;
};
