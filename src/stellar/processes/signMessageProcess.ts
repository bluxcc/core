import { IStore } from '../../store';
import { walletsConfig } from '../../wallets';
import { BluxEvent } from '../../utils/events';
import { Route, SupportedWallet } from '../../enums';
import handleSignMessage from '../handleSignMessage';

const signMessageProcess = async (store: IStore) => {
  const signMessage = store.signMessage;

  if (!signMessage) {
    store.emitter.emit(BluxEvent.SignMessageFailed, {
      message: 'Missing signMessage request in store.',
    });

    store.setRoute(Route.FAILED);

    return;
  }

  store.setRoute(Route.WAITING);

  if (!store.user) {
    store.emitter.emit(BluxEvent.SignMessageFailed, {
      message: 'User is missing for message signing.',
      messageToSign: signMessage.message,
      network: signMessage.options.network,
    });

    store.setRoute(Route.FAILED);

    return;
  }

  const { authMethod, authValue } = store.user;

  if (authMethod !== 'wallet') {
    store.emitter.emit(BluxEvent.SignMessageFailed, {
      message: 'Only wallet auth method can sign messages.',
      messageToSign: signMessage.message,
      network: signMessage.options.network,
    });

    store.setRoute(Route.FAILED);

    return;
  }

  const wallet = walletsConfig[authValue as SupportedWallet];

  // TODO: if it's not wallet, then it's email. fix that
  if (!wallet) {
    store.emitter.emit(BluxEvent.SignMessageFailed, {
      message: 'Could not find wallet config for message signing.',
      messageToSign: signMessage.message,
      network: signMessage.options.network,
    });

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

    store.emitter.emit(BluxEvent.SignMessageSucceeded, {
      signature: result,
      message: signMessage.message,
      network: signMessage.options.network,
    });

    setTimeout(() => {
      store.setRoute(Route.SUCCESSFUL);
    }, 400);
  } catch (cause) {
    store.emitter.emit(BluxEvent.SignMessageFailed, {
      message: 'Message signing failed.',
      messageToSign: signMessage.message,
      network: signMessage.options.network,
      cause,
    });

    setTimeout(() => {
      store.setRoute(Route.FAILED);
    }, 200);
  }
};

export default signMessageProcess;
