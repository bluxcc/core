import { Route } from '../../enums';
import { IStore } from '../../store';
import { IWallet } from '../../types';
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

      setRecentConnectionMethod(wallet.name);

      setTimeout(() => {
        store.setRoute(Route.SUCCESSFUL);

        setTimeout(() => {
          store.connectWalletSuccessful(publicKey, passphrase);
        }, 1000);
      }, 500);
    }
  } catch {
    store.setRoute(Route.FAILED);
  }
};

export default connectWalletProcess;
