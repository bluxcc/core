import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const onekeyConfig: IWallet = {
  name: SupportedWallet.Onekey,
  website: 'https://onekey.so',

  connect: async () => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('Onekey Wallet is not installed or connected.');
      }

      const address = await window.$onekey!.stellar!.getPublicKey();

      console.log(address);

      return address;
    } catch (error: any) {
      throw new Error('Failed to connect to Onekey.');
    }
  },
  disconnect: async () => { },
  getNetwork: async () => {
    throw new Error('Failed to get network from Onekey');
  },

  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.$onekey?.stellar;
  },
  signAuthEntry: async (authEntry, options) => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('Onekey Wallet is not installed or connected.');
      }

      const result = await window.$onekey!.stellar!.signAuthEntry(authEntry, {
        address: options.address,
        networkPassphrase: options.network,
      });

      console.log(result);

      return result;
    } catch (error) {
      throw new Error('Failed to sign auth entry with Onekey.');
    }
  },
  signMessage: async (message, options) => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('Onekey Wallet is not installed or connected.');
      }

      const result = await window.$onekey!.stellar!.signMessage(message, {
        address: options.address,
        networkPassphrase: options.network,
      });

      console.log(result);

      return result;
    } catch (error) {
      throw new Error('Failed to sign message with Onekey.');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('Onekey Wallet is not installed or connected.');
      }

      const result = await window.$onekey!.stellar!.signTransaction(xdr, {
        address: options.address,
        networkPassphrase: options.network,
      });

      console.log(result);

      return result;
    } catch (error) {
      throw new Error('Failed to sign the transaction with Onekey.');
    }
  },
};
