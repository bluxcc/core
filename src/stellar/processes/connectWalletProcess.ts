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

      store.connectWalletSuccessful(publicKey, passphrase);

      setRecentConnectionMethod(wallet.name);

      setTimeout(() => {
        store.setRoute(Route.SUCCESSFUL);
      }, 500);
    }
  } catch {
    store.setRoute(Route.FAILED);
  }
};

export default connectWalletProcess;
