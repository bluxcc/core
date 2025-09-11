import { createElement } from "react";
import { createRoot } from "react-dom/client";

import { Route } from "./enums";
import { getState } from "./store";
import { Provider } from "./components/provider";
import { IConfig, IInternalConfig } from "./types";
import { defaultLightTheme } from "./constants/themes";
import { handleLoadWallets, validateNetworkOptions } from "./utils/helpers";

import "./tailwind.css";

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
    loginMethods: config.loginMethods || ["wallet"],
    showWalletUIs: !!config.showWalletUIs,
    explorer: config.explorer || "stellarchain",
    defaultNetwork: "",
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

export const logout = () => { };
