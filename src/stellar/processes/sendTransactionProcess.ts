import { Route } from '../../enums';
import { IStore } from '../../store';
import handleTransactionSigning from './../handleTransactionSigning';

const sendTransactionProcess = async (store: IStore) => {
  const sendTransaction = store.sendTransaction;

  if (!sendTransaction) {
    store.setRoute(Route.FAILED);

    return;
  }

  store.setRoute(Route.WAITING);

  try {
    const result = await handleTransactionSigning(
      // todo
      // @ts-ignore
      sendTransaction.wallet,
      sendTransaction.xdr,
      store.user?.address as string,
      sendTransaction.options.network,
      // todo
      // @ts-ignore
      store.config.transports || {},
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
