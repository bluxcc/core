import albedo from "@albedo-link/intent";

import { IWallet } from "../types";
import { SupportedWallet } from "../enums";
import { getNetworkByPassphrase } from "../utils/helpers";

export const albedoConfig: IWallet = {
  name: SupportedWallet.Albedo,
  website: "https://albedo.link",

  isAvailable: () => true,

  connect: async () => {
    try {
      const result = await albedo.publicKey({ token: "Connect to Albedo" });
      return { publicKey: result.pubkey };
    } catch (error) {
      throw new Error("Failed to connect to Albedo.");
    }
  },

  signTransaction: async (xdr: string, options = {}): Promise<string> => {
    try {
      const { address, submit } = options;

      const result = await albedo.tx({
        xdr,
        pubkey: address,
        network:
          options?.networkPassphrase &&
          getNetworkByPassphrase(options?.networkPassphrase),
        submit,
      });

      return result.signed_envelope_xdr;
    } catch (error) {
      throw new Error("Failed to sign the transaction with Albedo.");
    }
  },
  getNetwork: async () => {
    throw new Error("Failed to get network from albedo");
  },
};
