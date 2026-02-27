import { Route } from '../enums';
import { timeout } from '../utils/helpers';
import { getState, IUser } from '../store';
import { BluxEvent } from '../utils/events';
import { BLUX_JWT_STORE } from '../constants/consts';
import { ISendTransaction, ISignMessage } from '../types';
import handleSignMessage from '../stellar/handleSignMessage';
import getTransactionDetails from '../stellar/getTransactionDetails';
import handleTransactionSigning from '../stellar/handleTransactionSigning';
import {
  checkRecentLogins,
  clearRecentLoginConfig,
} from '../utils/checkRecentLogins';

export const _login = (isSilent: boolean) => {
  const store = getState();

  if (store.user) {
    return Promise.resolve(store.user);
  }

  if (store.login?.promise) {
    return store.login.promise;
  }

  let resolver: (value: IUser) => void;
  let rejecter: (reason: any) => void;

  const promise = new Promise<IUser>((res, rej) => {
    resolver = res;
    rejecter = rej;
  });

  store.setLogin({
    promise,
    isSilent,
    // @ts-ignore
    resolver,
    // @ts-ignore
    rejecter,
  });

  if (isSilent) {
    checkRecentLogins()
      .then(() => {
        const { user } = getState();

        if (user) {
          resolver(user);
        } else {
        }
      })
      .catch(() => { })
      .finally(() => {
        store.setLogin(undefined);
      });

    return promise;
  }

  (async () => {
    const current = getState();

    if (current.login?.isSilent && current.login.promise) {
      try {
        await current.login.promise;
      } catch { }

      if (getState().user) {
        // @ts-ignore
        resolver(getState().user);

        store.setLogin(undefined);

        return;
      }
    }

    const s2 = getState();

    if (!s2.modal.isOpen) s2.openModal(Route.ONBOARDING);
  })().catch((err) => {
    rejecter(err);

    store.setLogin(undefined);
  });

  return promise;
};

export const login = async (): Promise<IUser> => {
  while (true) {
    const s = getState();

    if (s.authState.isReady) break;

    await timeout(50);
  }

  return _login(false);
};

const logout = () => {
  const { logoutAction } = getState();

  logoutAction();

  localStorage.removeItem(BLUX_JWT_STORE);
  clearRecentLoginConfig();

  getState().emitter.emit(BluxEvent.Logout, undefined);
};

const profile = () => {
  const { openModal, authState, modal } = getState();

  const { isAuthenticated } = authState;

  if (!isAuthenticated) {
    throw new Error('User is not authenticated.');
  }

  if (!modal.isOpen) {
    openModal(Route.PROFILE);
  }
};

const _signTransaction = (
  xdr: string,
  shouldSubmit: boolean,
  options?: { network: string },
) =>
  new Promise((resolve, reject) => {
    const state = getState();

    if (!state.authState.isAuthenticated || !state.stellar || !state.user) {
      state.emitter.emit(BluxEvent.TransactionFailed, {
        message: 'User is not authenticated.',
        xdr,
        shouldSubmit,
      });

      reject(new Error('User is not authenticated.'));

      return;
    }

    if (state.modal.isOpen) {
      state.emitter.emit(BluxEvent.TransactionFailed, {
        message: 'Blux modal is open elsewhere.',
        xdr,
        shouldSubmit,
      });

      reject(new Error('Blux modal is open elsewhere.'));

      return;
    }

    let network = state.stellar.activeNetwork;

    if (options && options.network) {
      network = options.network;
    }

    if (!getTransactionDetails(xdr, network)) {
      state.emitter.emit(BluxEvent.TransactionFailed, {
        message: 'Invalid XDR.',
        xdr,
        network,
        shouldSubmit,
      });

      reject('Invalid XDR');

      return;
    }

    const foundWallet = state.wallets.find(
      (w) => w.name === state.user!.authValue,
    );

    if (!foundWallet) {
      state.emitter.emit(BluxEvent.TransactionFailed, {
        message: 'Could not find the connected wallet.',
        xdr,
        network,
        shouldSubmit,
      });

      throw new Error('Could not find the connected wallet.');
    }

    const transactionObject: ISendTransaction = {
      xdr,
      rejecter: reject,
      resolver: resolve,
      result: undefined,
      options: {
        network,
        ...options,
      },
      shouldSubmit,
    };

    state.emitter.emit(BluxEvent.SignTransactionRequested, {
      xdr,
      network,
      shouldSubmit,
    });

    state.setSendTransaction(transactionObject, state.config.showWalletUIs);

    if (!state.config.showWalletUIs) {
      handleTransactionSigning(
        foundWallet,
        xdr,
        state.user.address,
        network,
        state.config.transports || {},
        transactionObject.shouldSubmit,
      )
        .then((result) => {
          if (transactionObject.shouldSubmit) {
            state.emitter.emit(BluxEvent.TransactionSubmitted, {
              result,
              xdr,
              network,
            });
          } else if (typeof result === 'string') {
            state.emitter.emit(BluxEvent.TransactionSigned, {
              signedXdr: result,
              xdr,
              network,
            });
          }

          resolve(result);
        })
        .catch((cause) => {
          state.emitter.emit(BluxEvent.TransactionFailed, {
            message: 'Transaction signing failed.',
            xdr,
            network,
            shouldSubmit,
            cause,
          });

          reject(cause);
        });

      return;
    }
  });

export const signTransaction = async (
  xdr: string,
  options?: { network: string },
) => {
  return await _signTransaction(xdr, false, options);
};

export const sendTransaction = async (
  xdr: string,
  options?: { network: string },
) => {
  return await _signTransaction(xdr, true, options);
};

export const signMessage = (message: string, options?: { network: string }) =>
  new Promise((resolve, reject) => {
    const state = getState();

    if (!state.authState.isAuthenticated || !state.stellar || !state.user) {
      state.emitter.emit(BluxEvent.SignMessageFailed, {
        message: 'User is not authenticated.',
        messageToSign: message,
      });

      reject(new Error('User is not authenticated.'));

      return;
    }

    if (state.modal.isOpen) {
      state.emitter.emit(BluxEvent.SignMessageFailed, {
        message: 'Blux modal is open elsewhere.',
        messageToSign: message,
      });

      reject(new Error('Blux modal is open elsewhere.'));

      return;
    }

    let network = state.stellar.activeNetwork;

    if (options && options.network) {
      network = options.network;
    }

    const foundWallet = state.wallets.find(
      (w) => w.name === state.user!.authValue,
    );

    if (!foundWallet) {
      state.emitter.emit(BluxEvent.SignMessageFailed, {
        message: 'Could not find the connected wallet.',
        messageToSign: message,
        network,
      });

      throw new Error('Could not find the connected wallet.');
    }

    state.emitter.emit(BluxEvent.SignMessageRequested, {
      message,
      network,
    });

    const signMessageDetails: ISignMessage = {
      message,
      options: options || { network },
      rejecter: reject,
      resolver: resolve,
      result: undefined,
    };

    state.setSignMessage(signMessageDetails, state.config.showWalletUIs);

    if (!state.config.showWalletUIs) {
      handleSignMessage(foundWallet, message, state!.user.address, network)
        .then((result) => {
          state.emitter.emit(BluxEvent.SignMessageSucceeded, {
            signature: result,
            message,
            network,
          });

          resolve(result);
        })
        .catch((cause) => {
          state.emitter.emit(BluxEvent.SignMessageFailed, {
            message: 'Message signing failed.',
            messageToSign: message,
            network,
            cause,
          });

          reject(cause);
        });

      return;
    }
  });

export const blux = {
  login,
  logout,
  profile,
  signMessage,
  signTransaction,
  sendTransaction,
  get isReady() {
    const { authState } = getState();

    return authState.isReady;
  },
  get isAuthenticated() {
    const { authState } = getState();

    return authState.isAuthenticated;
  },
  get user() {
    const { user } = getState();

    return user;
  },
};
