import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const bitgetConfig: IWallet = {
  name: SupportedWallet.Bitget,
  website: 'https://bitget.com',

  connect: async () => {
    try {
      if (typeof window === 'undefined' || !window.bitkeep?.stellar) {
        throw new Error('Bitget Wallet is not installed or connected.');
      }

      const address = await window.bitkeep!.stellar!.connect();

      console.log(address);

      return address;
    } catch (error: any) {
      throw new Error('Failed to connect to Bitget.');
    }
  },
  disconnect: async () => { },
  getNetwork: async () => {
    const network = await window.bitkeep!.stellar!.network();

    console.log(network);

    return network;
  },

  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.bitkeep?.stellar;
  },
  signAuthEntry: async (_authEntry, _options) => {
    throw new Error('Failed to sign auth entry with Bitget');
  },
  signMessage: async (message, options) => {
    try {
      if (typeof window === 'undefined' || !window.bitkeep?.stellar) {
        throw new Error('Bitkeep Wallet is not installed or connected.');
      }

      const result = await window.bitkeep!.stellar!.signMessage(
        message,
        options.address,
      );

      console.log(result);

      return result;
    } catch (error) {
      throw new Error('Failed to sign message with Bitkeep.');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (typeof window === 'undefined' || !window.bitkeep?.stellar) {
        throw new Error('Bitget Wallet is not installed or connected.');
      }

      const result = await window.bitkeep!.stellar!.signTransaction(xdr, {
        address: options.address,
        networkPassphrase: options.network,
      });

      console.log(result);

      return result;
    } catch (error) {
      throw new Error('Failed to sign the transaction with Bitget.');
    }
  },
};
