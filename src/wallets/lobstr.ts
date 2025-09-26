import lobstr from "@lobstrco/signer-extension-api";

import { IWallet } from "../types";
import { SupportedWallet } from "../enums";

export const lobstrConfig: IWallet = {
  name: SupportedWallet.Lobstr,
  website: "https://lobstr.co",

  connect: async () => {
    try {
      if (!(await lobstr.isConnected())) {
        throw new Error("LOBSTR Wallet is not installed or connected.");
      }

      const publicKey = await lobstr.getPublicKey();

      return publicKey;
    } catch {
      throw new Error("Failed to connect to LOBSTR.");
    }
  },
  disconnect: async () => {},
  getNetwork: async () => {
    throw new Error("Failed to get network from LOBSTR");
  },
  isAvailable: async () => {
    return await lobstr.isConnected();
  },
  signAuthEntry: async () => {
    throw new Error("LOBSTR does not support the signAuthEntry function");
  },
  signMessage: async () => {
    throw new Error("LOBSTR does not support the signMessage function");
  },
  signTransaction: async (xdr: string): Promise<string> => {
    try {
      if (!lobstr.signTransaction) {
        throw new Error("LOBSTR Wallet does not support signing transactions.");
      }

      const result = await lobstr.signTransaction(xdr);

      return result;
    } catch {
      throw new Error("Failed to sign the transaction with LOBSTR.");
    }
  },
};
