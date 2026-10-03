import { getState, subscribe } from '../store';

/**
 * Session bearer token for the signed-in user.
 *
 * Accepted sessions are saved in `localStorage` and validated with the Blux
 * API after a reload. This returns only the authenticated in-memory token,
 * so it is undefined while a saved session is being restored or after logout.
 * Page scripts can read the persisted bearer token.
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
