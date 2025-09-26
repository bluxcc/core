import { IWallet } from "../types";
import { SupportedWallet } from "../enums";

export const xBullConfig: IWallet = {
  name: SupportedWallet.Xbull,
  website: "https://xbull.app",

  connect: async () => {
    try {
      if (!window.xBullSDK) throw new Error("xBull Wallet is not installed");

      await window.xBullSDK.connect({
        canRequestPublicKey: true,
        canRequestSign: true,
      });

      const publicKey = await window.xBullSDK.getPublicKey();

      return publicKey;
    } catch {
      throw new Error("Failed to connect to xBull");
    }
  },
  disconnect: async () => {},
  getNetwork: async () => {
    try {
      if (!window.xBullSDK) throw new Error("xBull Wallet is not installed");

      const networkDetails = await window.xBullSDK.getNetwork();

      return {
        network: networkDetails.network,
        passphrase: networkDetails.networkPassphrase,
      };
    } catch {
      throw new Error("Error getting network from Rabet");
    }
  },
  isAvailable: () =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve(typeof window !== "undefined" && !!window.xBullSDK);
      }, 250);
    }),
  signAuthEntry: async () => {
    throw new Error("xBull does not support the signAuthEntry function");
  },
  signMessage: async (message, options) => {
    try {
      if (!window.xBullSDK) throw new Error("xBull Wallet is not installed");

      const result = await window.xBullSDK.signMessage(message, {
        address: options.address,
        networkPassphrase: options.network,
      });

      if (!!result.error) {
        throw new Error("Failed to signMessage using xBull");
      }

      return result.signedMessage as string;
    } catch {
      throw new Error("Failed to signMessage using xBull");
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (!window.xBullSDK) throw new Error("xBull Wallet is not installed.");

      const signedXdr = await window.xBullSDK.signXDR(xdr, {
        network: options.network,
        publicKey: options.address,
      });

      return signedXdr;
    } catch {
      throw new Error("Failed to sign the transaction with xBull.");
    }
  },
};
