import { defaultLightTheme } from "./constants/themes";
import { loginModal } from "./showModal";
import { IConfig, IInternalConfig, IWallet } from "./types";
import {
  timeout,
  getMappedWallets,
  initializeRabetMobile,
  validateNetworkOptions,
  getSortedCheckedWallets,
} from "./utils";

export class Blux {
  #config: IInternalConfig;
  #wallets: IWallet[] = [];
  #isReady: boolean = false;
  #isAuthenticated: boolean = false;

  constructor(config: IConfig) {
    // this.#loadWallets = this.#loadWallets.bind(this);

    const conf: IInternalConfig = {
      ...config,
      appearance: {
        ...defaultLightTheme,
        ...config?.appearance,
      },
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

    this.#config = conf;

    if (document.readyState === "complete") {
      this.#loadWallets();
    } else {
      window.addEventListener("load", () => {
        this.#loadWallets();
      });
    }
  }

  async #loadWallets() {
    console.log("load wallets happened");
    initializeRabetMobile();

    await timeout(150);

    const wallets = await getMappedWallets();
    const sortAvailableWallets = getSortedCheckedWallets(wallets);

    this.#wallets = sortAvailableWallets;
    this.#isReady = true;
  }

  get config() {
    return this.#config;
  }

  get isReady() {
    return this.#isReady;
  }

  async login() {
    if (!this.#isReady) {
      throw new Error("Cannot login when isReady is false.");
    }

    if (this.#isAuthenticated) {
      throw new Error("Already logged in.");
    }

    this.#wallets;

    loginModal(this.#wallets);
  }
}
