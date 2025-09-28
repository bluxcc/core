import albedo from "@albedo-link/intent";

import { IWallet } from "../types";
import { SupportedWallet } from "../enums";

export const albedoConfig: IWallet = {
  name: SupportedWallet.Albedo,
  website: "https://albedo.link",
  connect: async () => {
    try {
      const result = await albedo.publicKey({ token: "Connect to Albedo" });
      return result.pubkey;
    } catch (error) {
      throw new Error("Failed to connect to Albedo.");
    }
  },
  disconnect: async () => {},
  getNetwork: async () => {
    throw new Error("Albedo does not support the getNetwork function");
  },
  isAvailable: async () => true,
  signAuthEntry: async () => {
    throw new Error("Albedo does not support the signAuthEntry function");
  },
  signMessage: async (message, options) => {
    const result = await albedo.signMessage({
      message,
      pubkey: options.address,
    });

    return result.signed_message;
  },
  signTransaction: async (xdr, options): Promise<string> => {
    try {
      const result = await albedo.tx({
        xdr,
        pubkey: options.address,
        network: options.network,
      });

      return result.signed_envelope_xdr;
    } catch (error) {
      throw new Error("Failed to sign the transaction with Albedo.");
    }
  },
};
