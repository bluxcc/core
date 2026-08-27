import { Route } from '../../enums';
import { IStore } from '../../store';
import { getSigningWallet } from '../../wallets';
import handleSignMessage from '../handleSignMessage';

const signMessageProcess = async (store: IStore) => {
  const signMessage = store.signMessage;

  if (!signMessage) {
    store.setRoute(Route.FAILED);

    return;
  }

  store.setRoute(Route.WAITING);

  if (!store.user) {
    store.setRoute(Route.FAILED);

    return;
  }

  const wallet = getSigningWallet(store.user, store.wallets);

  if (!wallet) {
    store.setRoute(Route.FAILED);

    return;
  }

  try {
    const result = await handleSignMessage(
      wallet,
      signMessage.message,
      store.user?.address as string,
    );

    store.setSignMessage(
      {
        ...signMessage,
        result,
      },
      true,
      Route.WAITING,
    );

    setTimeout(() => {
      store.setRoute(Route.SUCCESSFUL);
    }, 400);
  } catch (cause) {
    setTimeout(() => {
      store.setRoute(Route.FAILED);
    }, 200);
  }
};

export default signMessageProcess;
