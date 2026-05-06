import { Route } from '../../enums';
import { getState } from '../../store';
import loginResolver from './loginResolver';
import { BluxEvent } from '../../utils/events';

export const completeLoginProcess = () => {
  const state = getState();

  state.setIsAuthenticated(true);
  state.closeModal();

  loginResolver();

  const nextState = getState();

  if (nextState.user) {
    nextState.emitter.emit(BluxEvent.LoggedIn, { user: nextState.user });
  }
};

const continueLoginProcess = () => {
  const state = getState();

  state.setRoute(Route.ACCEPT_TERMS_AND_PRIVACY);
};

export default continueLoginProcess;
