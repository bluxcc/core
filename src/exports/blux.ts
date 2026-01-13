import { Route } from '../enums';
import { getState } from '../store';
import { BLUX_JWT_STORE } from '../constants/consts';
import { ISendTransaction, ISignMessage } from '../types';
import handleSignMessage from '../stellar/handleSignMessage';
import getTransactionDetails from '../stellar/getTransactionDetails';
import handleTransactionSigning from '../stellar/handleTransactionSigning';

export const login = async () => {
  const { authState, openModal, modal } = getState();
  const { isReady, isAuthenticated } = authState;

  if (!isReady) {
    throw new Error('Cannot connect when isReady is false.');
  }

  if (isAuthenticated) {
    throw new Error('Already connected.');
  }

  if (!modal.isOpen) {
    openModal(Route.ONBOARDING);
  }
};

const logout = () => {
  const { logoutAction } = getState();

  logoutAction();

  localStorage.removeItem(BLUX_JWT_STORE);
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
      reject(new Error('User is not authenticated.'));

      return;
    }

    if (state.modal.isOpen) {
      reject(new Error('Blux modal is open elsewhere.'));

      return;
    }

    let network = state.stellar.activeNetwork;

    if (options && options.network) {
      network = options.network;
    }

    if (!getTransactionDetails(xdr, network)) {
      reject('Invalid XDR');

      return;
    }

    const foundWallet = state.wallets.find(
      (w) => w.name === state.user!.authValue,
    );

    if (!foundWallet) {
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
          resolve(result);
        })
        .catch((err) => {
          reject(err);
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
      reject(new Error('User is not authenticated.'));

      return;
    }

    if (state.modal.isOpen) {
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
      throw new Error('Could not find the connected wallet.');
    }

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
          resolve(result);
        })
        .catch((err) => {
          reject(err);
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
