import { Route } from '../../enums';
import { IWallet } from '../../types';
import { isAccessDenied } from '../../utils/errors';
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

      // The API enforces the project's allowlist/blocklist here. A blocked
      // address must not be let in. Other (network/server) errors are
      // non-fatal — recording the connection is best-effort.
      try {
        await apiStoreWalletConnection(
          store.config.appId,
          wallet.name,
          publicKey,
        );
      } catch (cause) {
        if (isAccessDenied(cause)) {
          store.setLoginError(cause.message);
          store.setRoute(Route.FAILED);

          return;
        }
      }

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
