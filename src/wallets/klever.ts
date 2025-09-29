import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const kleverConfig: IWallet = {
  name: SupportedWallet.Klever,
  website: 'https://klever.io',

  connect: async () => {
    try {
      const result = await window.kleverWallet!.stellar!.getAddress();

      return result.address;
    } catch {
      throw new Error('Failed to connect to Klever');
    }
  },
  disconnect: async () => {},
  getNetwork: async () => {
    try {
      const result = await window.kleverWallet!.stellar!.getNetwork();

      return {
        network: result.network,
        passphrase: result.networkPassphrase,
      };
    } catch {
      throw new Error('Failed to getNetwork from Klever');
    }
  },
  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.kleverWallet?.stellar;
  },
  signAuthEntry: async (authEntry, options) => {
    try {
      const result = await window.kleverWallet!.stellar!.signAuthEntry(
        authEntry,
        {
          address: options.address,
          networkPassphrase: options.network,
        },
      );

      return result.signedAuthEntry;
    } catch {
      throw new Error('Failed to signAuthEntry using Klever');
    }
  },
  signMessage: async (message, options) => {
    try {
      const result = await window.kleverWallet!.stellar!.signMessage(message, {
        address: options.address,
        networkPassphrase: options.network,
      });

      return result.signedMessage;
    } catch {
      throw new Error('Failed to signMessage using Klever');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      const result = await window.kleverWallet!.stellar!.signTransaction(
        xdr,
        options,
      );

      return result.signedTxXdr;
    } catch {
      throw new Error('Failed to signTransaction using Klever');
    }
  },
};
