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

  getState().emitter.emit(BluxEvent.LoggedOut, undefined);
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
        .catch((cause) => {
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
        .catch((cause) => {
          reject(cause);
        });

      return;
    }
  });

// todo: check
const fundMe = () => {
  const state = getState();

  if (!state.authState.isAuthenticated || !state.stellar || !state.user) {
    throw new Error('Blux: user is not authenticated yet.');
  }

  if (state.modal.isOpen) {
    throw new Error('Blux modal is open elsewhere.');
  }

  if (!state.modal.isOpen) {
    state.openModal(Route.FUND_ME);
  }
};

export const blux = {
  login,
  logout,
  // todo: check
  fundMe,
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
