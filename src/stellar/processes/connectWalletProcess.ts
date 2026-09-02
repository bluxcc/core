import { Route } from '../../enums';
import { IWallet } from '../../types';
import signTransaction from '../signTransaction';
import handleSignMessage from '../handleSignMessage';
import { isAccessDenied } from '../../utils/errors';
import { getState, IStore, IUser, setState } from '../../store';
import continueLoginProcess, {
  completeLoginProcess,
} from './continueLoginProcess';
import { apiWalletChallenge, apiVerifyWalletChallenge } from '../../utils/api';
import {
  getWalletNetwork,
  setRecentConnectionMethod,
} from '../../utils/helpers';

export type ConnectWalletProcessOptions = {
  /**
   * Skip Blux waiting/success/failed screens and persist the session as soon
   * as the wallet returns a signed challenge. Wallet extension / hardware
   * prompts still appear.
   */
  headless?: boolean;
};

const proveWalletOwnership = async (
  store: IStore,
  wallet: IWallet,
  publicKey: string,
): Promise<string> => {
  // Prove the user controls this address. Most wallets sign a SEP-10 challenge
  // transaction (sequence 0, ManageData only — never submittable). Wallets
  // flagged `authenticateWithSignedMessage` (Freighter, Hana, Rabet, OneKey) sign a SEP-53
  // challenge string instead, because they treat the unsubmittable TX as a
  // real payment and block on insufficient XLM. Either proof is exchanged for
  // a session JWT. Hardware wallets like Ledger keep the transaction path.
  if (wallet.authenticateWithSignedMessage) {
    const { challenge, network_passphrase } = await apiWalletChallenge(
      store.config.appId,
      wallet.name,
      publicKey,
      'signed_message',
    );

    if (!challenge) {
      throw new Error('BLUX: Login challenge is missing.');
    }

    const signedMessage = await handleSignMessage(
      wallet,
      challenge,
      publicKey,
      network_passphrase,
    );

    return apiVerifyWalletChallenge(store.config.appId, signedMessage, {
      proofType: 'signed_message',
      challenge,
    });
  }

  const { challenge_xdr, network_passphrase } = await apiWalletChallenge(
    store.config.appId,
    wallet.name,
    publicKey,
  );

  if (!challenge_xdr) {
    throw new Error('BLUX: Login challenge is missing.');
  }

  // Sign on the network the challenge was built for (the API default is
  // testnet), NOT the wallet's currently-selected network: the server finds
  // the challenge by its transaction hash, so signing on a different network
  // produces a different hash and verification fails. The challenge XDR is
  // passed through untouched for the same reason.
  const signedXdr = await signTransaction(
    wallet,
    challenge_xdr,
    publicKey,
    network_passphrase,
  );

  return apiVerifyWalletChallenge(store.config.appId, signedXdr);
};

const connectWalletProcess = async (
  store: IStore,
  wallet: IWallet,
  options?: ConnectWalletProcessOptions,
): Promise<IUser | void> => {
  const headless = !!options?.headless;

  if (headless) {
    setState((state) => ({
      ...state,
      loginError: undefined,
      waitingStatus: 'login',
      user: {
        address: '',
        walletPassphrase: '',
        authMethod: 'wallet',
        authValue: wallet.name,
      },
    }));
  } else {
    store.connectWallet(wallet.name);
  }

  try {
    const publicKey = await wallet.connect();

    if (!publicKey || publicKey.trim() === '') {
      if (headless) {
        throw new Error('BLUX: Wallet did not return an address.');
      }

      return;
    }

    let jwt: string;

    try {
      jwt = await proveWalletOwnership(store, wallet, publicKey);
    } catch (cause) {
      if (headless) {
        throw cause;
      }

      // Blocked by the project's allowlist/blocklist → dedicated screen with the
      // reason. Everything else (user rejected the signature, wrong network,
      // expired/used challenge, verification failed) → generic failure screen,
      // from which retrying restarts the flow with a fresh challenge.
      if (isAccessDenied(cause)) {
        store.setLoginError((cause as Error).message);
      }

      store.setRoute(Route.FAILED);

      return;
    }

    // The session network shown in the app is the wallet's actual network, which
    // is independent of the (testnet) network the ownership challenge used.
    const passphrase = await getWalletNetwork(wallet);

    // Hold the JWT in memory until terms are accepted (completeLoginProcess).
    store.setAuth({
      isAuthenticated: false,
      JWT: jwt,
    });

    setRecentConnectionMethod(wallet.name);

    if (headless) {
      store.connectWalletSuccessful(publicKey, passphrase);
      completeLoginProcess();

      const user = getState().user;

      if (!user?.address) {
        throw new Error('BLUX: Failed to login!');
      }

      return user;
    }

    setTimeout(() => {
      if (!getState().modal.isOpen) {
        return;
      }

      store.connectWalletSuccessful(publicKey, passphrase);

      store.setRoute(Route.SUCCESSFUL);

      setTimeout(() => {
        if (!getState().modal.isOpen) {
          return;
        }

        continueLoginProcess();
      }, 1000);
    }, 500);
  } catch (cause) {
    if (headless) {
      throw cause;
    }

    store.setRoute(Route.FAILED);
  }
};

export default connectWalletProcess;
