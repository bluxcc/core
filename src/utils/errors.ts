// Thrown when the Blux API rejects a login because the project restricts access
// (allowlist or blocklist mode) and the wallet address, email, or social
// identity being used is not permitted. Unlike a transient failure, this is not
// retryable — the same identity will keep being rejected.
export const ACCESS_DENIED_FALLBACK =
  'This account is not allowed to access this app';

export class BluxAccessDeniedError extends Error {
  constructor(message?: string) {
    super(message && message.trim() ? message : ACCESS_DENIED_FALLBACK);

    this.name = 'BluxAccessDeniedError';
  }
}

export const isAccessDenied = (
  error: unknown,
): error is BluxAccessDeniedError =>
  error instanceof BluxAccessDeniedError ||
  (error instanceof Error && error.name === 'BluxAccessDeniedError');

// Social login delivers the API's message back as a plain string (posted from
// the OAuth popup), so it can't be matched with instanceof. Fall back to
// matching the API's phrasing.
export const looksLikeAccessDenied = (message: string): boolean =>
  /not allowed to access/i.test(message);
