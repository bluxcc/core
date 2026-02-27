import { IStore } from '../../store';
import { walletsConfig } from '../../wallets';
import { BluxEvent } from '../../utils/events';
import { Route, SupportedWallet } from '../../enums';
import handleTransactionSigning from './../handleTransactionSigning';

const sendTransactionProcess = async (store: IStore) => {
  const sendTransaction = store.sendTransaction;

  if (!sendTransaction) {
    store.emitter.emit(BluxEvent.TransactionFailed, {
      message: 'Missing sendTransaction request in store.',
    });

    store.setRoute(Route.FAILED);

    return;
  }

  store.setRoute(Route.WAITING);

  if (!store.user) {
    store.emitter.emit(BluxEvent.TransactionFailed, {
      message: 'User is missing for transaction signing.',
      xdr: sendTransaction.xdr,
      network: sendTransaction.options.network,
      shouldSubmit: sendTransaction.shouldSubmit,
    });

    store.setRoute(Route.FAILED);

    return;
  }

  const { authMethod, authValue } = store.user;

  if (authMethod !== 'wallet') {
    store.emitter.emit(BluxEvent.TransactionFailed, {
      message: 'Only wallet auth method can sign transactions.',
      xdr: sendTransaction.xdr,
      network: sendTransaction.options.network,
      shouldSubmit: sendTransaction.shouldSubmit,
    });

    store.setRoute(Route.FAILED);

    return;
  }

  const wallet = walletsConfig[authValue as SupportedWallet];

  // TODO: if it's not wallet, then it's email. fix that
  if (!wallet) {
    store.emitter.emit(BluxEvent.TransactionFailed, {
      message: 'Could not find wallet config for transaction signing.',
      xdr: sendTransaction.xdr,
      network: sendTransaction.options.network,
      shouldSubmit: sendTransaction.shouldSubmit,
    });

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

    if (sendTransaction.shouldSubmit) {
      store.emitter.emit(BluxEvent.TransactionSubmitted, {
        result,
        xdr: sendTransaction.xdr,
        network: sendTransaction.options.network,
      });
    } else if (typeof result === 'string') {
      store.emitter.emit(BluxEvent.TransactionSigned, {
        signedXdr: result,
        xdr: sendTransaction.xdr,
        network: sendTransaction.options.network,
      });
    }

    setTimeout(() => {
      store.setRoute(Route.SUCCESSFUL);
    }, 400);
  } catch (cause) {
    store.emitter.emit(BluxEvent.TransactionFailed, {
      message: 'Transaction signing failed.',
      xdr: sendTransaction.xdr,
      network: sendTransaction.options.network,
      shouldSubmit: sendTransaction.shouldSubmit,
      cause,
    });

    setTimeout(() => {
      store.setRoute(Route.FAILED);
    }, 200);
  }
};

export default sendTransactionProcess;
