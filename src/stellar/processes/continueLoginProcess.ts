import { Route } from '../../enums';
import { getState } from '../../store';
import loginResolver from './loginResolver';
import { BluxEvent } from '../../utils/events';
import { clearLegacyJwtStorage } from '../../utils/sessionJwt';
import {
  clearRecentLoginConfig,
  setRecentLoginConfig,
} from '../../utils/checkRecentLogins';

export const completeLoginProcess = () => {
  const state = getState();
  const jwt = state.auth?.JWT;

  // Mark the session authenticated only after terms are accepted (or when the
  // project has none). The bearer token stays in memory. Wallet reconnect can
  // be remembered without it; email, social, and passkey sessions cannot.
  clearLegacyJwtStorage();

  if (jwt) {
    state.setAuth({ isAuthenticated: true, JWT: jwt });

    if (state.user?.authMethod === 'wallet') {
      setRecentLoginConfig(
        state.user.authMethod,
        state.user.authValue || '',
        Date.now(),
      );
    } else {
      clearRecentLoginConfig();
    }
  }

  state.setIsAuthenticated(true);
  state.closeModal();

  loginResolver();

  const nextState = getState();

  if (nextState.user) {
    nextState.emitter.emit(BluxEvent.LoggedIn, { user: nextState.user });
  }
};

// Tear down a login that reached the terms prompt (or was abandoned there)
// without accepting. The JWT is only in memory at this point; still wipe
// storage so a previous write cannot restore the session.
export const rejectLoginProcess = (
  reason = 'BLUX: User declined the terms of service.',
) => {
  const state = getState();

  if (state.login) {
    state.login.rejecter(reason);
    state.setLogin(undefined);
  }

  clearLegacyJwtStorage();
  clearRecentLoginConfig();
  state.logoutAction();
};

const continueLoginProcess = () => {
  const state = getState();

  if (
    state.apiResponse &&
    (state.apiResponse.privacyPolicy || state.apiResponse.terms)
  ) {
    state.setRoute(Route.ACCEPT_TERMS_AND_PRIVACY);
  } else {
    completeLoginProcess();
  }
};

export default continueLoginProcess;
