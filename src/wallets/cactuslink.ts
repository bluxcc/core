import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const cactusLinkConfig: IWallet = {
  name: SupportedWallet.CactusLink,
  website: 'https://www.mycactus.com',

  connect: async () => {
    try {
      if (typeof window === 'undefined' || !window.cactuslink_stellar) {
        throw new Error('BLUX: Cactus Link Wallet is not installed.');
      }

      const requestAccessResult =
        await window.cactuslink_stellar.requestAccess();

      if (requestAccessResult.error) {
        throw new Error(`BLUX: ${requestAccessResult.error}`);
      }

      const { address } = await window.cactuslink_stellar.getAddress();

      if (!address) {
        throw new Error(
          'BLUX: Getting the address from Cactus Link is not allowed, please request access first.',
        );
      }

      return address;
    } catch {
      throw new Error('BLUX: Failed to connect to Cactus Link.');
    }
  },
  disconnect: async () => { },
  getNetwork: async () => {
    try {
      if (typeof window === 'undefined' || !window.cactuslink_stellar) {
        throw new Error('BLUX: Cactus Link Wallet is not installed.');
      }

      const { network, networkPassphrase, error } =
        await window.cactuslink_stellar.getNetwork();

      if (error) {
        throw new Error(`BLUX: ${error}`);
      }

      return {
        network,
        passphrase: networkPassphrase,
      };
    } catch {
      throw new Error('BLUX: Failed to get network from Cactus Link');
    }
  },
  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.cactuslink_stellar;
  },
  signAuthEntry: async (authEntry, options) => {
    try {
      if (typeof window === 'undefined' || !window.cactuslink_stellar) {
        throw new Error('BLUX: Cactus Link Wallet is not installed.');
      }

      const { signedAuthEntry } =
        await window.cactuslink_stellar.signAuthEntry(authEntry, {
          address: options.address,
          networkPassphrase: options.network,
        });

      if (!signedAuthEntry) {
        throw new Error('BLUX: signedAuthEntry returned from Cactus Link is undefined.');
      }

      return signedAuthEntry;
    } catch {
      throw new Error('BLUX: Failed to sign auth entry with Cactus Link.');
    }
  },
  signMessage: async (message, options) => {
    try {
      if (typeof window === 'undefined' || !window.cactuslink_stellar) {
        throw new Error('BLUX: Cactus Link Wallet is not installed.');
      }

      const { signedMessage } = await window.cactuslink_stellar.signMessage(
        message,
        {
          address: options.address,
          networkPassphrase: options.network,
        },
      );

      if (!signedMessage) {
        throw new Error('BLUX: signedMessage returned from Cactus Link is undefined.');
      }

      return signedMessage;
    } catch {
      throw new Error('BLUX: Failed to sign message with Cactus Link.');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (typeof window === 'undefined' || !window.cactuslink_stellar) {
        throw new Error('BLUX: Cactus Link Wallet is not installed.');
      }

      const { signedTxXdr } = await window.cactuslink_stellar.signTransaction(
        xdr,
        {
          address: options.address,
          networkPassphrase: options.network,
        },
      );

      return signedTxXdr;
    } catch {
      throw new Error('BLUX: Failed to sign the transaction with Cactus Link.');
    }
  },
};
