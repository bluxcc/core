import { Route } from '../../enums';
import { getState } from '../../store';
import loginResolver from './loginResolver';
import { BluxEvent } from '../../utils/events';
import { BLUX_JWT_STORE } from '../../constants/consts';
import {
  clearRecentLoginConfig,
  setRecentLoginConfig,
} from '../../utils/checkRecentLogins';

export const completeLoginProcess = () => {
  const state = getState();
  const jwt = state.auth?.JWT;

  // Persist the session only after terms are accepted (or when the project
  // has none). Writing the JWT earlier left a rejected user logged in.
  if (jwt) {
    localStorage.setItem(BLUX_JWT_STORE, jwt);
    state.setAuth({ isAuthenticated: true, JWT: jwt });

    if (state.user) {
      setRecentLoginConfig(
        state.user.authMethod,
        state.user.authValue || '',
        Date.now(),
        jwt,
      );
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

  localStorage.removeItem(BLUX_JWT_STORE);
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
