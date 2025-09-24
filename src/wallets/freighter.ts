import freighterApi, {
  signMessage,
  signTransaction,
} from "@stellar/freighter-api";

import { IWallet } from "../types";
import { SupportedWallet } from "../enums";

export const freighterConfig: IWallet = {
  name: SupportedWallet.Freighter,
  website: "https://freighter.app",

  isAvailable: () =>
    new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 1500);

      setTimeout(async () => {
        try {
          freighterApi
            .isConnected()
            .then(({ isConnected, error }) => {
              if (!isConnected) {
                setTimeout(() => {
                  freighterApi
                    .isConnected()
                    .then(({ isConnected: isCon, error: err }) => {
                      clearTimeout(timeout);

                      resolve(!err && isCon);
                    });
                }, 250);
              } else {
                clearTimeout(timeout);

                resolve(!error && isConnected);
              }
            })
            .catch(() => {
              clearTimeout(timeout);

              resolve(false);
            });
        } catch {
          resolve(false);
        }
      }, 500);
    }),

  connect: async () => {
    try {
      if (!(await freighterApi.isConnected())) {
        throw new Error("Freighter Wallet is not installed or connected.");
      }

      const result = await freighterApi.requestAccess();

      if (
        result.error &&
        result.error.message === "The user rejected this request."
      ) {
        throw new Error("Failed to connect to Freighter");
      }

      if (result.address.trim() === "") {
        throw new Error("Failed to connect to Freighter.");
      }

      return { publicKey: result.address };
    } catch (error: any) {
      if (error.message === "Failed to connect to Freighter.") {
        const res = await freighterConfig.connect();

        return res;
      }

      throw new Error("Failed to connect to Freighter.");
    }
  },

  signTransaction: async (xdr: string, options = {}): Promise<string> => {
    try {
      if (!(await freighterApi.isConnected())) {
        throw new Error("Freighter Wallet is not installed or connected.");
      }

      const result = await signTransaction(xdr, {
        address: options?.address,
        networkPassphrase: options?.networkPassphrase,
      });

      return result.signedTxXdr;
    } catch (error) {
      throw new Error("Failed to sign the transaction with Freighter.");
    }
  },
  getNetwork: async () => {
    try {
      if (!(await freighterApi.isConnected())) {
        throw new Error("Freighter Wallet is not installed or connected.");
      }

      const network = await freighterApi.getNetwork();

      if (network.error) {
        throw new Error("Failed to get network from Freighter");
      }

      return {
        network: network.network,
        passphrase: network.networkPassphrase,
      };
    } catch {
      throw new Error("Failed to disconnect from Rabet.");
    }
  },
  signMessage: async (message, options) => {
    try {
      const { signedMessage, signerAddress, error } = await signMessage(
        message,
        {
          address: options.address,
          networkPassphrase: options.networkPassphrase,
        },
      );

      if (error || !signedMessage) {
        throw new Error("Failed to sign message using Freighter");
      }

      return {
        signedMessage:
          typeof signedMessage === "string"
            ? signedMessage
            : Buffer.from(signedMessage).toString("base64"),
        signerAddress: signerAddress,
      };
    } catch {
      throw new Error("Failed to sign message using Freighter");
    }
  },
};
