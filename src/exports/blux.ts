import { Route } from '../enums';
import { getState, IUser } from '../store';
import { BluxEvent } from '../utils/events';
import { assertAppIsValid, waitForBluxReady } from '../utils/appValidity';
import { BLUX_JWT_STORE } from '../constants/consts';
import { ISendTransaction, ISignAuthEntry, ISignMessage } from '../types';
import handleSignMessage from '../stellar/handleSignMessage';
import getTransactionDetails from '../stellar/getTransactionDetails';
import handleTransactionSigning from '../stellar/handleTransactionSigning';
import {
  checkRecentLogins,
  clearRecentLoginConfig,
} from '../utils/checkRecentLogins';
import handleSignAuthEntry from '../stellar/handleSignAuthEntry';

/**
 * Internal login driver. Prefer the public {@link login}.
 *
 * @param isSilent - When `true`, tries to restore a recent session without opening the modal.
 * @returns A promise that resolves to the authenticated user.
 */
export const _login = (isSilent: boolean) => {
  const store = getState();

  if (store.user && store.user.address) {
    return Promise.resolve(store.user);
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

/**
 * Opens the Blux modal so the user can connect a wallet or sign in, resolving
 * once authenticated. Waits for the SDK to finish initializing first.
 *
 * @returns The authenticated user.
 */
export const login = async (): Promise<IUser> => {
  await waitForBluxReady();

  // A bad appId (missing, wrong, deleted, used from a disallowed origin, or an
  // unreachable Blux API) disables login entirely — throw before the onboarding
  // modal can ever open.
  assertAppIsValid();

  return _login(false);
};

/** Logs the user out, clearing the stored session/JWT and emitting a logged-out event. */
const logout = () => {
  const { logoutAction } = getState();

  logoutAction();

  localStorage.removeItem(BLUX_JWT_STORE);
  clearRecentLoginConfig();

  getState().emitter.emit(BluxEvent.LoggedOut, undefined);
};

/**
 * Opens the profile modal for the signed-in user.
 *
 * @throws If no user is authenticated.
 */
const profile = () => {
  assertAppIsValid();

  const { openModal, authState, modal } = getState();

  const { isAuthenticated } = authState;

  if (!isAuthenticated) {
    throw new Error('BLUX: User is not authenticated.');
  }

  if (!modal.isOpen) {
    openModal(Route.PROFILE);
  }
};

/**
 * Internal driver behind {@link signTransaction} and {@link sendTransaction}.
 *
 * @param xdr - The transaction envelope XDR.
 * @param shouldSubmit - When `true`, submit after signing; when `false`, only sign.
 * @param options - Optional network passphrase override.
 * @returns The signed XDR, or the submitted-transaction result when `shouldSubmit` is true.
 */
const _signTransaction = (
  xdr: string,
  shouldSubmit: boolean,
  options?: { network: string },
) =>
  new Promise((resolve, reject) => {
    // Throwing inside the executor rejects the returned promise.
    assertAppIsValid();

    const state = getState();

    if (!state.authState.isAuthenticated || !state.stellar || !state.user) {
      reject(new Error('BLUX: User is not authenticated.'));

      return;
    }

    if (state.modal.isOpen) {
      reject(new Error('BLUX: Blux modal is open elsewhere.'));

      return;
    }

    let network = state.stellar.activeNetwork;

    if (options && options.network) {
      network = options.network;
    }

    if (!getTransactionDetails(xdr, network)) {
      reject('BLUX: Invalid XDR');

      return;
    }

    const foundWallet = state.wallets.find(
      (w) => w.name === state.user!.authValue,
    );

    if (!foundWallet) {
      throw new Error('BLUX: Could not find the connected wallet.');
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

/**
 * Signs a transaction XDR with the connected wallet, without submitting it.
 *
 * @param xdr - The transaction envelope XDR to sign.
 * @param options - Optional network passphrase override.
 * @returns The signed transaction XDR.
 * @throws If the user is not authenticated or the Blux modal is open elsewhere.
 */
export const signTransaction = async (
  xdr: string,
  options?: { network: string },
) => {
  return await _signTransaction(xdr, false, options);
};

/**
 * Signs a transaction XDR with the connected wallet and submits it to the network.
 *
 * @param xdr - The transaction envelope XDR to sign and submit.
 * @param options - Optional network passphrase override.
 * @returns The submitted transaction result (an {@link ISubmittedTransaction}).
 * @throws If the user is not authenticated or the Blux modal is open elsewhere.
 */
export const sendTransaction = async (
  xdr: string,
  options?: { network: string },
) => {
  return await _signTransaction(xdr, true, options);
};

/**
 * Signs an arbitrary message with the connected wallet.
 *
 * @param message - The message to sign.
 * @param options - Optional network passphrase override.
 * @returns The signature.
 * @throws If the user is not authenticated or the Blux modal is open elsewhere.
 */
export const signMessage = (message: string, options?: { network: string }) =>
  new Promise((resolve, reject) => {
    // Throwing inside the executor rejects the returned promise.
    assertAppIsValid();

    const state = getState();

    if (!state.authState.isAuthenticated || !state.stellar || !state.user) {
      reject(new Error('BLUX: User is not authenticated.'));

      return;
    }

    if (state.modal.isOpen) {
      reject(new Error('BLUX: Blux modal is open elsewhere.'));

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
      throw new Error('BLUX: Could not find the connected wallet.');
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

/**
 * Opens the fund-me modal so the user can top up their account.
 *
 * @throws If no user is authenticated or the modal is already open elsewhere.
 */
const fundMe = () => {
  assertAppIsValid();

  const state = getState();

  if (!state.authState.isAuthenticated || !state.stellar || !state.user) {
    throw new Error('BLUX: Blux: user is not authenticated yet.');
  }

  if (state.modal.isOpen) {
    throw new Error('BLUX: Blux modal is open elsewhere.');
  }

  if (!state.modal.isOpen) {
    state.openModal(Route.FUND_ME);
  }
};

/**
 * Signs a Soroban authorization entry with the connected wallet.
 *
 * @param authEntry - The base64 authorization entry to sign.
 * @param options - Optional network passphrase override.
 * @returns The signed authorization entry.
 * @throws If the user is not authenticated or the Blux modal is open elsewhere.
 */
export const signAuthEntry = (
  authEntry: string,
  options?: { network: string },
) =>
  new Promise((resolve, reject) => {
    // Throwing inside the executor rejects the returned promise.
    assertAppIsValid();

    const state = getState();

    if (!state.authState.isAuthenticated || !state.stellar || !state.user) {
      reject(new Error('BLUX: User is not authenticated.'));

      return;
    }

    if (state.modal.isOpen) {
      reject(new Error('BLUX: Blux modal is open elsewhere.'));

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
      throw new Error('BLUX: Could not find the connected wallet.');
    }

    const signAuthEntryDetails: ISignAuthEntry = {
      authEntry,
      options: options || { network },
      rejecter: reject,
      resolver: resolve,
      result: undefined,
    };

    state.setSignAuthEntry(signAuthEntryDetails, state.config.showWalletUIs);

    if (!state.config.showWalletUIs) {
      handleSignAuthEntry(foundWallet, authEntry, state!.user.address, network)
        .then((result) => {
          resolve(result);
        })
        .catch((cause) => {
          reject(cause);
        });

      return;
    }
  });

/**
 * The Blux client: authentication, wallet signing, and account UI entry points.
 * Each method carries its own documentation; the getters expose live auth state.
 */
export const blux = {
  login,
  logout,
  fundMe,
  profile,
  signMessage,
  signAuthEntry,
  signTransaction,
  sendTransaction,
  /** Whether the SDK has finished initializing and is ready to use. */
  get isReady() {
    const { authState } = getState();

    return authState.isReady;
  },
  /** Whether a user is currently authenticated. */
  get isAuthenticated() {
    const { authState } = getState();

    return authState.isAuthenticated;
  },
  /** The currently authenticated user, or `undefined` when logged out. */
  get user() {
    const { user } = getState();

    return user;
  },
};
