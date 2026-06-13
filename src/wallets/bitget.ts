import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const bitgetConfig: IWallet = {
  name: SupportedWallet.Bitget,
  website: 'https://bitget.com',

  connect: async () => {
    try {
      if (typeof window === 'undefined' || !window.bitkeep?.stellar) {
        throw new Error('BLUX: Bitget Wallet is not installed or connected.');
      }

      const address = await window.bitkeep!.stellar!.connect();

      return address;
    } catch (error: any) {
      throw new Error('BLUX: Failed to connect to Bitget.');
    }
  },
  disconnect: async () => { },
  getNetwork: async () => {
    const network = await window.bitkeep!.stellar!.network();

    return { network: network.network, passphrase: network.networkPassphrase };
  },

  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.bitkeep?.stellar;
  },
  signAuthEntry: async (_authEntry, _options) => {
    throw new Error('BLUX: Failed to sign auth entry with Bitget');
  },
  signMessage: async (message, options) => {
    try {
      if (typeof window === 'undefined' || !window.bitkeep?.stellar) {
        throw new Error('BLUX: Bitkeep Wallet is not installed or connected.');
      }

      const signedHex = await window.bitkeep!.stellar!.signMessage(
        message,
        options.address,
      );

      const bytes = new Uint8Array(
        // @ts-ignore
        signedHex.match(/.{1,2}/g).map((b) => parseInt(b, 16)),
      );
      // @ts-ignore
      const signedMessage = btoa(String.fromCharCode(...bytes));

      return signedMessage;
    } catch (error) {
      throw new Error('BLUX: Failed to sign message with Bitkeep.');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (typeof window === 'undefined' || !window.bitkeep?.stellar) {
        throw new Error('BLUX: Bitget Wallet is not installed or connected.');
      }

      const result = await window.bitkeep!.stellar!.signTransaction(xdr, {
        address: options.address,
        networkPassphrase: options.network,
      });

      return result;
    } catch (error) {
      throw new Error('BLUX: Failed to sign the transaction with Bitget.');
    }
  },
};
