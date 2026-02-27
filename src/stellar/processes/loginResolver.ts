import { IStore } from '../../store';

const loginResolver = (store: IStore) => {
  if (store.login) {
    if (store.user) {
      store.login.resolver(store.user);
    } else {
      store.login.rejecter('BLUX: Failed to login!');
    }

    store.setLogin(undefined);
  }
};

export default loginResolver;
