import { getState } from '../store';
import { timeout } from './helpers';

// Single source of truth for "is this appId usable". createConfig kicks off
// authenticateAppId(), which writes its result to `apiResponse`. That call
// never rejects: it maps every failure mode the appId can have — missing,
// wrong, deleted, used from a disallowed origin, or an unreachable Blux API —
// to `{ isValid: false }`. So `apiResponse` alone tells us all three states:
//   undefined          -> validation still in flight
//   { isValid: false } -> invalid, Blux must stay disabled
//   { isValid: true }  -> good to go

/** Whether appId validation has finished (regardless of the outcome). */
export const isAppValidated = (): boolean =>
  getState().apiResponse !== undefined;

/** Whether the configured appId was confirmed valid by the Blux API. */
export const isAppValid = (): boolean =>
  getState().apiResponse?.isValid === true;

/**
 * Throws when the appId is known to be invalid. Every authentication / wallet
 * entry point (login, profile, fundMe, and all signing methods) calls this so
 * Blux refuses to operate with a bad appId. The read-only chain helpers under
 * `exports/core` intentionally do NOT call this — they don't depend on the
 * appId and must keep working.
 *
 * No-op while validation is still pending: callers that need a settled result
 * (e.g. login) await {@link waitForBluxReady} first; the rest are already gated
 * behind an auth check that can't pass before validation completes.
 */
export const assertAppIsValid = (): void => {
  const { apiResponse } = getState();

  if (apiResponse && !apiResponse.isValid) {
    throw new Error(
      'BLUX: appId is invalid' +
        (apiResponse.message ? ` — ${apiResponse.message}` : '') +
        '. Login and signing are disabled until a valid appId is configured.',
    );
  }
};

/**
 * Resolves once the SDK has finished initializing (wallets loaded) AND appId
 * validation has settled, so the caller can then assert validity. Polls because
 * both happen asynchronously after createConfig.
 */
export const waitForBluxReady = async (): Promise<void> => {
  while (true) {
    const state = getState();

    if (state.authState.isReady && isAppValidated()) {
      break;
    }

    await timeout(50);
  }
};
