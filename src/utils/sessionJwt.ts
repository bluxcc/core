import { BLUX_JWT_STORE } from '../constants/consts';
import { getState, subscribe } from '../store';

/**
 * Session bearer token for the signed-in user.
 *
 * The token stays in the in-memory store. It is not written to `localStorage`
 * or `sessionStorage`. The Blux dashboard (and any other first-party host)
 * reads it with this function while the tab is open. A reload starts signed out
 * for email, social, and passkey sessions, because restoring those sessions
 * would mean persisting the bearer token where page scripts can read it.
 */
export const getJwt = (): string | undefined => {
  const auth = getState().auth;

  if (!auth?.isAuthenticated || !auth.JWT) {
    return undefined;
  }

  return auth.JWT;
};

/** Notifies when the in-memory session changes. The listener receives no state. */
export const subscribeSession = (onStoreChange: () => void): (() => void) =>
  subscribe(() => {
    onStoreChange();
  });

/** Deletes a bearer token left behind by older SDK versions. */
export const clearLegacyJwtStorage = (): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(BLUX_JWT_STORE);
  } catch {
    // Storage can throw in private mode or when it is blocked.
  }
};
