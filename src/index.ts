import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { Route } from "./enums";
import { getState } from "./store";
import { Provider } from "./components/provider";
import { IConfig, IInternalConfig } from "./types";
import { defaultLightTheme } from "./constants/themes";
import { handleLoadWallets, validateNetworkOptions } from "./utils/helpers";

import "./tailwind.css";
import getTransactionDetails from "./stellar/getTransactionDetails";

let root: any = null;
let isInitiated = false;
let container: HTMLDivElement | null = null;

const init = () => {
  container = document.createElement("div");
  document.body.appendChild(container);

  root = createRoot(container);
  root.render(createElement(Provider));
};

export function createConfig(config: IConfig) {
  if (isInitiated) {
    throw new Error("Config has already been set");
  }

  isInitiated = true;

  init();

  const conf: IInternalConfig = {
    ...config,
    appearance: {
      ...defaultLightTheme,
      ...config?.appearance,
    },
    lang: config.lang || "en",
    defaultNetwork: "",
    showWalletUIs: !!config.showWalletUIs,
    explorer: config.explorer || "stellarchain",
    loginMethods: config.loginMethods || ["wallet"],
  };

  validateNetworkOptions(
    config.networks,
    config.defaultNetwork,
    config.transports,
  );

  conf.defaultNetwork = config.defaultNetwork ?? config.networks[0];

  const { setConfig, setWallets, setIsReady } = getState();

  setConfig(conf);

  handleLoadWallets().then((wallets) => {
    setWallets(wallets);
    setIsReady(true);
  });
}

const login = async () => {
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
  // const { isReady, isAuthenticated } = authState;
  // if (!isAuthenticated) {
  //   throw new Error("User is not authenticated.");
  // }
  // setRoute(Routes.PROFILE);
  // setValue((prev) => ({ ...prev, isModalOpen: true }));
};

const sendTransaction = (xdr: string, options: { network: string }) =>
  new Promise((resolve, reject) => {
    // const { authState, wallets, config, user } = getState();
    //
    // let network = value.activeNetwork;
    //
    // if (options && options.network) {
    //   network = options.network;
    // }
    //
    // if (!authState.isAuthenticated) {
    //   reject(new Error("User is not authenticated."));
    // }
    //
    // if (!getTransactionDetails(xdr, network)) {
    //   reject("Invalid XDR");
    //
    //   return;
    // }
    //
    // const transactionObject = {
    //   xdr,
    //   result: null,
    //   rejecter: reject,
    //   resolver: resolve,
    // };
    //
    // const foundWallet = wallets.find((w) => w.name === user.authValue);
    //
    // if (!foundWallet) {
    //   throw new Error("Could not find the connected wallet.");
    // }
    //
    // if (!config.showWalletUIs) {
    //   handleTransactionSigning(
    //     foundWallet,
    //     xdr,
    //     user.address as string,
    //     config.transports || {},
    //   )
    //     .then((result) => {
    //       resolve(result);
    //     })
    //     .catch((err) => {
    //       reject(err);
    //     });
    //
    //   return;
    // }
    //
    // setRoute(Route.SIGN_TRANSACTION);
    //
    // setValue((prev) => ({
    //   ...prev,
    //   isModalOpen: true,
    //   signTransaction: transactionObject,
    // }));
  });

export const Blux = {
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
