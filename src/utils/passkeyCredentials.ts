// Passkey login is identifier-first: the Blux API binds every WebAuthn challenge
// to a specific user, so the SDK must tell the server *which* credential is about
// to sign before the ceremony runs (see POST /auth, auth_method "passkey"). We
// therefore remember the credential id this browser registered for an app — keyed
// by appId, with no expiry, since WebAuthn credentials don't expire — and replay
// it on the next login. A first-time user (or a new browser) has nothing stored,
// which is exactly how the flow knows to register a new passkey instead of
// logging an existing one in.

const storageKey = (appId: string) => `__BLUX__PASSKEY_CRED__${appId}`;

export const getStoredPasskeyCredentialId = (appId: string): string | null => {
  if (typeof window === 'undefined' || !appId) {
    return null;
  }

  try {
    return localStorage.getItem(storageKey(appId)) || null;
  } catch {
    return null;
  }
};

export const setStoredPasskeyCredentialId = (
  appId: string,
  credentialId: string,
): void => {
  if (typeof window === 'undefined' || !appId || !credentialId) {
    return;
  }

  try {
    localStorage.setItem(storageKey(appId), credentialId);
  } catch {
    // Storage may be unavailable (private mode / blocked); login still works
    // this session, the user just won't be recognized as returning next time.
  }
};

export const clearStoredPasskeyCredentialId = (appId: string): void => {
  if (typeof window === 'undefined' || !appId) {
    return;
  }

  try {
    localStorage.removeItem(storageKey(appId));
  } catch {
    // ignore
  }
};

// A unique, throwaway handle used only to mint the *registration* challenge. The
// server creates a temporary user row keyed by this value and renames it to the
// real credential id once registration verifies, so it only has to be unique and
// non-empty — never a constant, or different users would collide on one row.
export const createPasskeyRegistrationHandle = (): string => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `blux-pk-${crypto.randomUUID()}`;
    }
  } catch {
    // fall through to the getRandomValues / Math.random fallback
  }

  const bytes = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }

  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `blux-pk-${hex}`;
};
