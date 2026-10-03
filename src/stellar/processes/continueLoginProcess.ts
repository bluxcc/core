import { Route } from '../../enums';
import { getState } from '../../store';
import loginResolver from './loginResolver';
import { BluxEvent } from '../../utils/events';
import {
  clearRecentLoginConfig,
  setRecentLoginConfig,
} from '../../utils/checkRecentLogins';

export const completeLoginProcess = () => {
  const state = getState();
  const jwt = state.auth?.JWT;

  // Mark the session authenticated only after terms are accepted (or when the
  // project has none). Pending or rejected logins must never be persisted.

  if (jwt) {
    if (state.user) {
      setRecentLoginConfig(
        state.user.authMethod,
        state.user.authValue || '',
        Date.now(),
        jwt,
      );
    } else {
      clearRecentLoginConfig();
    }

    state.setAuth({ isAuthenticated: true, JWT: jwt });

    // A host listening for auth changes can cancel the login immediately.
    if (getState().auth?.JWT !== jwt || getState().user !== state.user) return;
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
// without accepting. Clear any older saved session as well.
export const rejectLoginProcess = (
  reason = 'BLUX: User declined the terms of service.',
) => {
  const state = getState();

  if (state.login) {
    state.login.rejecter(reason);
    state.setLogin(undefined);
  }

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
