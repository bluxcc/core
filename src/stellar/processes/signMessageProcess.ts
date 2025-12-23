import { Route, SupportedWallet } from '../../enums';
import { IStore } from '../../store';
import { walletsConfig } from '../../wallets';
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

  const { authMethod, authValue } = store.user;

  if (authMethod !== 'wallet') {
    store.setRoute(Route.FAILED);

    return;
  }

  const wallet = walletsConfig[authValue as SupportedWallet];

  // TODO: if it's not wallet, then it's email. fix that
  if (!wallet) {
    store.setRoute(Route.FAILED);

    return;
  }

  try {
    const result = await handleSignMessage(
      wallet,
      signMessage.message,
      store.user?.address as string,
      signMessage.options.network,
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
  } catch {
    setTimeout(() => {
      store.setRoute(Route.FAILED);
    }, 200);
  }
};

export default signMessageProcess;
