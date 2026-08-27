import { Route } from '../../enums';
import { IWallet } from '../../types';
import signTransaction from '../signTransaction';
import handleSignMessage from '../handleSignMessage';
import { isAccessDenied } from '../../utils/errors';
import { getState, IStore } from '../../store';
import continueLoginProcess from './continueLoginProcess';
import { apiWalletChallenge, apiVerifyWalletChallenge } from '../../utils/api';
import {
  getWalletNetwork,
  setRecentConnectionMethod,
} from '../../utils/helpers';

const connectWalletProcess = async (store: IStore, wallet: IWallet) => {
  store.connectWallet(wallet.name);

  try {
    const publicKey = await wallet.connect();

    if (!publicKey || publicKey.trim() === '') {
      return;
    }

    // Prove the user controls this address. Most wallets sign a SEP-10 challenge
    // transaction (sequence 0, ManageData only — never submittable). Wallets
    // flagged `authenticateWithSignedMessage` (Freighter, Hana, Rabet, OneKey) sign a SEP-53
    // challenge string instead, because they treat the unsubmittable TX as a
    // real payment and block on insufficient XLM. Either proof is exchanged for
    // a session JWT. Hardware wallets like Ledger keep the transaction path.
    let jwt: string;

    try {
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

        jwt = await apiVerifyWalletChallenge(
          store.config.appId,
          signedMessage,
          {
            proofType: 'signed_message',
            challenge,
          },
        );
      } else {
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

        jwt = await apiVerifyWalletChallenge(store.config.appId, signedXdr);
      }
    } catch (cause) {
      // Blocked by the project's allowlist/blocklist → dedicated screen with the
      // reason. Everything else (user rejected the signature, wrong network,
      // expired/used challenge, verification failed) → generic failure screen,
      // from which retrying restarts the flow with a fresh challenge.
      if (isAccessDenied(cause)) {
        store.setLoginError(cause.message);
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
    store.setRoute(Route.FAILED);
  }
};

export default connectWalletProcess;
