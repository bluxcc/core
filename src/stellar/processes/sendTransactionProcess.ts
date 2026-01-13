import { Route, SupportedWallet } from '../../enums';
import { IStore } from '../../store';
import { walletsConfig } from '../../wallets';
import handleTransactionSigning from './../handleTransactionSigning';

const sendTransactionProcess = async (store: IStore) => {
  const sendTransaction = store.sendTransaction;

  if (!sendTransaction) {
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
    const result = await handleTransactionSigning(
      wallet,
      sendTransaction.xdr,
      store.user?.address as string,
      sendTransaction.options.network,
      store.config.transports || {},
      sendTransaction.shouldSubmit,
    );

    store.setSendTransaction(
      {
        ...sendTransaction,
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

export default sendTransactionProcess;
