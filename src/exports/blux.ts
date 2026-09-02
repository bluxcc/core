import { Route } from '../enums';
import { getState } from '../store';
import { BluxEvent } from '../utils/events';
import { assertAppIsValid } from '../utils/appValidity';
import { BLUX_JWT_STORE } from '../constants/consts';
import { ISendTransaction, ISignAuthEntry, ISignMessage } from '../types';
import handleSignMessage from '../stellar/handleSignMessage';
import getTransactionDetails from '../stellar/getTransactionDetails';
import handleTransactionSigning from '../stellar/handleTransactionSigning';
import { clearRecentLoginConfig } from '../utils/checkRecentLogins';
import handleSignAuthEntry from '../stellar/handleSignAuthEntry';
import { getSigningWallet } from '../wallets';
import {
  login,
  loginEmail,
  loginOAuth,
  loginPasskey,
  loginSms,
  loginWallet,
} from './loginMethods';

export { _login } from './loginMethods';
export {
  login,
  loginEmail,
  loginOAuth,
  loginPasskey,
  loginSms,
  loginWallet,
} from './loginMethods';
export type {
  LoginCodeApi,
  LoginCodeFn,
  LoginOAuthOptions,
} from './loginMethods';

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

    const foundWallet = getSigningWallet(state.user, state.wallets);

    if (!foundWallet) {
      reject(new Error('BLUX: Could not find the connected wallet.'));

      return;
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
 * @returns The signature.
 * @throws If the user is not authenticated or the Blux modal is open elsewhere.
 */
export const signMessage = (message: string) =>
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

    const foundWallet = getSigningWallet(state.user, state.wallets);

    if (!foundWallet) {
      reject(new Error('BLUX: Could not find the connected wallet.'));

      return;
    }

    const signMessageDetails: ISignMessage = {
      message,
      rejecter: reject,
      resolver: resolve,
      result: undefined,
    };

    state.setSignMessage(signMessageDetails, state.config.showWalletUIs);

    if (!state.config.showWalletUIs) {
      handleSignMessage(foundWallet, message, state!.user.address)
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

    const foundWallet = getSigningWallet(state.user, state.wallets);

    if (!foundWallet) {
      reject(new Error('BLUX: Could not find the connected wallet.'));

      return;
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
  loginEmail,
  loginSms,
  loginOAuth,
  loginPasskey,
  loginWallet,
  logout,
  fundMe,
  profile,
  signMessage,
  signAuthEntry,
  signTransaction,
  sendTransaction,
  /** Whether the SDK has finished initializing and is ready to use. Wallet
   *  availability is not part of this wait when `loginMethods` omits `'wallet'`. */
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
