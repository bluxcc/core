import { Route } from '../../enums';
import { IWallet } from '../../types';
import loginResolver from './loginResolver';
import { getState, IStore } from '../../store';
import { BluxEvent } from '../../utils/events';
import { apiStoreWalletConnection } from '../../utils/api';
import { setRecentLoginConfig } from '../../utils/checkRecentLogins';
import {
  getWalletNetwork,
  setRecentConnectionMethod,
} from '../../utils/helpers';

const connectWalletProcess = async (store: IStore, wallet: IWallet) => {
  getState().emitter.emit(BluxEvent.LoginStarted, {
    method: 'wallet',
    authValue: wallet.name,
  });

  store.connectWallet(wallet.name);

  try {
    const publicKey = await wallet.connect();

    if (publicKey && publicKey.trim() !== '') {
      const passphrase = await getWalletNetwork(wallet);

      void apiStoreWalletConnection(
        store.config.appId,
        wallet.name,
        publicKey,
      ).catch(() => { });

      setRecentConnectionMethod(wallet.name);
      setRecentLoginConfig('wallet', wallet.name);

      setTimeout(() => {
        store.connectWalletSuccessful(publicKey, passphrase);

        store.setRoute(Route.SUCCESSFUL);

        setTimeout(() => {
          store.closeModal();

          loginResolver(store);
          store.setIsAuthenticated(true);

          const user = getState().user;

          if (user) {
            getState().emitter.emit(BluxEvent.Login, { user });
          }
        }, 1000);
      }, 500);
    } else {
      getState().emitter.emit(BluxEvent.LoginFailed, {
        message: 'Wallet returned an empty public key.',
      });
    }
  } catch (cause) {
    getState().emitter.emit(BluxEvent.LoginFailed, {
      message: 'Wallet connection failed.',
      cause,
    });

    store.setRoute(Route.FAILED);
  }
};

export default connectWalletProcess;
