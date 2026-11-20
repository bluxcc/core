import freighterApi, {
  isConnected,
  signMessage,
  signAuthEntry,
  requestAccess,
  signTransaction,
} from '@stellar/freighter-api';

import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const freighterConfig: IWallet = {
  name: SupportedWallet.Freighter,
  website: 'https://freighter.app',
  authenticateWithSignedMessage: true,

  connect: async () => {
    try {
      if (!(await isConnected())) {
        throw new Error(
          'BLUX: Varial (formerly Freighter) Wallet is not installed or connected.',
        );
      }

      const result = await requestAccess();

      if (
        result.error &&
        result.error.message === 'The user rejected this request.'
      ) {
        throw new Error(
          'BLUX: Failed to connect to Varial (formerly Freighter)',
        );
      }

      if (result.address.trim() === '') {
        throw new Error(
          'BLUX: Failed to connect to Varial (formerly Freighter).',
        );
      }

      return result.address;
    } catch (error: any) {
      if (
        error.message === 'Failed to connect to Varial (formerly Freighter).'
      ) {
        const res = await freighterConfig.connect();

        return res;
      }

      throw new Error(
        'BLUX: Failed to connect to Varial (formerly Freighter).',
      );
    }
  },
  disconnect: async () => {},
  getNetwork: async () => {
    try {
      if (!(await isConnected())) {
        throw new Error(
          'BLUX: Varial (formerly Freighter) Wallet is not installed or connected.',
        );
      }

      const network = await freighterApi.getNetwork();

      if (network.error) {
        throw new Error(
          'BLUX: Failed to get network from Varial (formerly Freighter)',
        );
      }

      return {
        network: network.network,
        passphrase: network.networkPassphrase,
      };
    } catch {
      throw new Error('BLUX: Failed to disconnect from Rabet.');
    }
  },
  isAvailable: () =>
    new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(false);
      }, 700);

      setTimeout(async () => {
        try {
          isConnected()
            .then(({ isConnected: isC, error }) => {
              if (!isC) {
                setTimeout(() => {
                  isConnected().then(({ isConnected: isCon, error: err }) => {
                    clearTimeout(timeout);

                    resolve(!err && isCon);
                  });
                }, 350);
              } else {
                clearTimeout(timeout);

                resolve(!error && isC);
              }
            })
            .catch(() => {
              clearTimeout(timeout);

              resolve(false);
            });
        } catch {
          resolve(false);
        }
      }, 450);
    }),
  signAuthEntry: async (authEntry, options) => {
    try {
      if (!(await isConnected())) {
        throw new Error(
          'BLUX: Varial (formerly Freighter) Wallet is not installed or connected.',
        );
      }

      const { error, signedAuthEntry } = await signAuthEntry(authEntry, {
        address: options.address,
        networkPassphrase: options.network,
      });

      if (error || !signedAuthEntry) {
        throw new Error(
          'BLUX: Could not signedAuthEntry using Varial (formerly Freighter)',
        );
      }

      return Buffer.from(signedAuthEntry).toString('base64');
    } catch (error) {
      throw new Error(
        'BLUX: Failed to sign the transaction with Varial (formerly Freighter).',
      );
    }
  },
  signMessage: async (message, options) => {
    try {
      const { signedMessage, error } = await signMessage(message, {
        address: options.address,
        // networkPassphrase: options.network,
      });

      if (error || !signedMessage) {
        throw new Error(
          'BLUX: Failed to sign message using Varial (formerly Freighter)',
        );
      }

      return typeof signedMessage === 'string'
        ? signedMessage
        : Buffer.from(signedMessage).toString('base64');
    } catch {
      throw new Error(
        'BLUX: Failed to sign message using Varial (formerly Freighter)',
      );
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (!(await isConnected())) {
        throw new Error(
          'BLUX: Varial (formerly Freighter) Wallet is not installed or connected.',
        );
      }

      const result = await signTransaction(xdr, {
        address: options.address,
        networkPassphrase: options.network,
      });

      return result.signedTxXdr;
    } catch (error) {
      throw new Error(
        'BLUX: Failed to sign the transaction with Varial (formerly Freighter).',
      );
    }
  },
};
