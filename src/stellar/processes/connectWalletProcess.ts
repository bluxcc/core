import { Route } from '../../enums';
import { IWallet } from '../../types';
import { getState, IStore } from '../../store';
import continueLoginProcess from './continueLoginProcess';
import { apiStoreWalletConnection } from '../../utils/api';
import { setRecentLoginConfig } from '../../utils/checkRecentLogins';
import {
  getWalletNetwork,
  setRecentConnectionMethod,
} from '../../utils/helpers';

const connectWalletProcess = async (store: IStore, wallet: IWallet) => {
  store.connectWallet(wallet.name);

  try {
    const publicKey = await wallet.connect();

    if (publicKey && publicKey.trim() !== '') {
      const passphrase = await getWalletNetwork(wallet);

      apiStoreWalletConnection(
        store.config.appId,
        wallet.name,
        publicKey,
      ).catch(() => { });

      setRecentConnectionMethod(wallet.name);
      setRecentLoginConfig('wallet', wallet.name, Date.now(), '');

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
    }
  } catch (cause) {
    store.setRoute(Route.FAILED);
  }
};

export default connectWalletProcess;
