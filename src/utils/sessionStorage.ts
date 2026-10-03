import { BLUX_JWT_STORE } from '../constants/consts';

const RECENT_LOGIN_CONFIG = '__BLUX__RECENT_LOGIN_CONFIG';
let revision = 0;

export type StoredSession = {
  appId?: string;
  authMethod: string;
  authValue: string;
  timestamp: number;
  jwt?: string;
};

/** Changes even when storage is blocked, so logout cancels pending restores. */
export const getSessionRevision = (): number => revision;

export const clearStoredSession = (): void => {
  revision++;

  if (typeof window === 'undefined') return;

  for (const key of [BLUX_JWT_STORE, RECENT_LOGIN_CONFIG]) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in private mode or embedded browsers.
    }
  }
};

export const writeStoredSession = (session: StoredSession): void => {
  revision++;

  if (typeof window === 'undefined') return;

  try {
    // Remove the previous record first; a partial write must never pair an old
    // user's metadata with a new user's token.
    localStorage.removeItem(RECENT_LOGIN_CONFIG);

    if (session.jwt) {
      localStorage.setItem(BLUX_JWT_STORE, session.jwt);
    } else {
      localStorage.removeItem(BLUX_JWT_STORE);
    }

    const { jwt, ...metadata } = session;
    localStorage.setItem(RECENT_LOGIN_CONFIG, JSON.stringify(metadata));
  } catch {
    clearStoredSession();
    // Login still succeeds in memory when persistence is unavailable.
  }
};

export const readStoredSession = (): StoredSession | undefined => {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(RECENT_LOGIN_CONFIG);
    if (!raw) return;

    const value = JSON.parse(raw);

    if (
      !value ||
      typeof value !== 'object' ||
      typeof value.authMethod !== 'string' ||
      !value.authMethod ||
      typeof value.authValue !== 'string' ||
      typeof value.timestamp !== 'number' ||
      !Number.isFinite(value.timestamp) ||
      (value.appId !== undefined && typeof value.appId !== 'string')
    ) {
      clearStoredSession();
      return;
    }

    const jwt = localStorage.getItem(BLUX_JWT_STORE) || value.jwt;

    return {
      appId: value.appId,
      authMethod: value.authMethod,
      authValue: value.authValue,
      timestamp: value.timestamp,
      jwt: typeof jwt === 'string' && jwt ? jwt : undefined,
    };
  } catch {
    clearStoredSession();
    return;
  }
};
