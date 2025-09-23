import { Route } from "../enums";
import { getState } from "../store";
import getTransactionDetails from "../stellar/getTransactionDetails";
import handleTransactionSigning from "../stellar/handleTransactionSigning";

export const login = async () => {
  const { authState, openModal } = getState();
  const { isReady, isAuthenticated } = authState;

  if (!isReady) {
    throw new Error("Cannot connect when isReady is false.");
  }

  if (isAuthenticated) {
    throw new Error("Already connected.");
  }

  openModal(Route.ONBOARDING);
};

const logout = () => {
  const { logoutAction } = getState();

  logoutAction();
};

const profile = () => {
  const { openModal, authState } = getState();

  const { isAuthenticated } = authState;

  if (!isAuthenticated) {
    throw new Error("User is not authenticated.");
  }

  openModal(Route.PROFILE);
};

export const sendTransaction = (xdr: string, options: { network: string }) =>
  new Promise((resolve, reject) => {
    const { authState, wallets, config, user, stellar, setSendTransaction } =
      getState();

    if (!authState.isAuthenticated || !stellar || !user) {
      reject(new Error("User is not authenticated."));

      return;
    }

    let network = stellar.activeNetwork;

    if (options && options.network) {
      network = options.network;
    }

    if (!getTransactionDetails(xdr, network)) {
      reject("Invalid XDR");

      return;
    }

    const transactionObject = {
      xdr,
      options,
      rejecter: reject,
      resolver: resolve,
      result: undefined,
    };

    const foundWallet = wallets.find((w) => w.name === user.authValue);

    if (!foundWallet) {
      throw new Error("Could not find the connected wallet.");
    }

    if (!config.showWalletUIs) {
      handleTransactionSigning(
        foundWallet,
        xdr,
        user.address,
        options,
        config.transports || {},
      )
        .then((result) => {
          resolve(result);
        })
        .catch((err) => {
          reject(err);
        });

      return;
    }

    setSendTransaction(transactionObject);
  });

export const blux = {
  login,
  logout,
  profile,
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
