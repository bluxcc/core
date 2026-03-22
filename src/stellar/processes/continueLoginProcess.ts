import { Route } from '../../enums';
import { getState } from '../../store';
import { BluxEvent } from '../../utils/events';
import loginResolver from './loginResolver';

export const completeLoginProcess = () => {
  const state = getState();

  state.setIsAuthenticated(true);
  state.closeModal();

  loginResolver();

  const nextState = getState();

  if (nextState.user) {
    nextState.emitter.emit(BluxEvent.Login, { user: nextState.user });
  }
};

const continueLoginProcess = () => {
  const state = getState();

  state.setRoute(Route.ACCEPT_TERMS_AND_PRIVACY);
};

export default continueLoginProcess;
