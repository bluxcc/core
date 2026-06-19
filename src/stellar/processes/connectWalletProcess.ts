import { Route } from '../../enums';
import { IWallet } from '../../types';
import signTransaction from '../signTransaction';
import { isAccessDenied } from '../../utils/errors';
import { getState, IStore } from '../../store';
import { BLUX_JWT_STORE } from '../../constants/consts';
import continueLoginProcess from './continueLoginProcess';
import {
  apiWalletChallenge,
  apiVerifyWalletChallenge,
} from '../../utils/api';
import { setRecentLoginConfig } from '../../utils/checkRecentLogins';
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

    // Prove the user controls this address with a SEP-10 challenge: the API
    // hands back a challenge transaction (sequence 0, ManageData only — never
    // submittable and moves no funds), the wallet signs it, and the signed XDR
    // is exchanged for a session JWT. A challenge transaction is used instead of
    // "sign message" so hardware wallets like Ledger — which can't sign
    // arbitrary messages — work too.
    let jwt: string;

    try {
      const { challenge_xdr, network_passphrase } = await apiWalletChallenge(
        store.config.appId,
        wallet.name,
        publicKey,
      );

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

    // Persist the session JWT the same way the other login methods do.
    localStorage.setItem(BLUX_JWT_STORE, jwt);
    store.setAuth({
      isAuthenticated: true,
      JWT: jwt,
    });

    setRecentConnectionMethod(wallet.name);
    setRecentLoginConfig('wallet', wallet.name, Date.now(), jwt);

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
