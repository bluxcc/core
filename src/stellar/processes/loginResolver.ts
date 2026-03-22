import { getState } from '../../store';

const loginResolver = () => {
  const store = getState();

  if (store.login) {
    if (
      store.user &&
      !!store.user.address &&
      store.authState.isAuthenticated
    ) {
      store.login.resolver(store.user);
    } else {
      store.login.rejecter('BLUX: Failed to login!');
    }

    store.setLogin(undefined);
  }
};

export default loginResolver;
