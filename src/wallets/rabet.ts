import { StellarNetwork, SupportedWallet } from "../enums";
import { IWallet } from "../types";

export const rabetConfig: IWallet = {
  name: SupportedWallet.Rabet,
  website: "https://rabet.io",

  isAvailable: () =>
    new Promise((resolve) => {
      setTimeout(
        () => resolve(typeof window !== "undefined" && !!window.rabet),
        250,
      );
    }),

  connect: async () => {
    try {
      if (!window.rabet) throw new Error("Rabet Wallet is not installed.");

      const result = await window.rabet.connect();

      return { publicKey: result.publicKey };
    } catch (error) {
      throw new Error("Failed to connect to Rabet.");
    }
  },

  signTransaction: async (xdr: string, options = {}): Promise<string> => {
    try {
      if (!window.rabet) throw new Error("Rabet Wallet is not installed.");

      const result = await window.rabet.sign(
        xdr,
        options.networkPassphrase === StellarNetwork.PUBLIC
          ? "mainnet"
          : "testnet",
      );

      return result.xdr;
    } catch (error) {
      throw new Error("Failed to sign the transaction with Rabet.");
    }
  },

  disconnect: async () => {
    try {
      if (!window.rabet) throw new Error("Rabet Wallet is not installed.");

      window.rabet.disconnect();
    } catch (error) {
      throw new Error("Failed to disconnect from Rabet.");
    }
  },
  getNetwork: async () => {
    try {
      if (!window.rabet) throw new Error("Rabet Wallet is not installed.");

      const network = await window.rabet.getNetwork();

      return network;
    } catch (error) {
      throw new Error("Error getting network from Rabet:");
    }
  },
};
