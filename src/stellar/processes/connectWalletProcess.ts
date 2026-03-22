import { Route } from '../../enums';
import { IWallet } from '../../types';
import { getState, IStore } from '../../store';
import { BluxEvent } from '../../utils/events';
import { apiStoreWalletConnection } from '../../utils/api';
import { setRecentLoginConfig } from '../../utils/checkRecentLogins';
import continueLoginProcess from './continueLoginProcess';
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
        if (!getState().modal.isOpen) {
          return;
        }

        store.connectWalletSuccessful(publicKey, passphrase);

        store.setRoute(Route.SUCCESSFUL);

        setTimeout(() => {
          if (!getState().modal.isOpen) {
            return;
          }

          continueLoginProcess();
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
