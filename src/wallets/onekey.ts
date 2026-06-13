import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const onekeyConfig: IWallet = {
  name: SupportedWallet.Onekey,
  website: 'https://onekey.so',

  connect: async () => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('BLUX: Onekey Wallet is not installed or connected.');
      }

      const address = await window.$onekey!.stellar!.getPublicKey();

      return address;
    } catch (error: any) {
      throw new Error('BLUX: Failed to connect to Onekey.');
    }
  },
  disconnect: async () => { },
  getNetwork: async () => {
    // Onekey wallet does have a getNetwork function but it always returns the public network
    // even when the network is changed inside the wallet.
    // try {
    //   const network = await window.$onekey!.stellar!.getNetwork();
    //
    //   return {
    //     network: network.network,
    //     passphrase: network.networkPassphrase,
    //   };
    // } catch {
    //   throw new Error('BLUX: Failed to get network from Onekey');
    // }
    //
    throw new Error('BLUX: Failed to get network from Onekey');
  },

  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.$onekey?.stellar;
  },
  signAuthEntry: async (authEntry, options) => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('BLUX: Onekey Wallet is not installed or connected.');
      }

      const result = await window.$onekey!.stellar!.signAuthEntry(authEntry, {
        address: options.address,
        networkPassphrase: options.network,
      });

      return result.signedAuthEntry;
    } catch (error) {
      throw new Error('BLUX: Failed to sign auth entry with Onekey.');
    }
  },
  signMessage: async (message, options) => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('BLUX: Onekey Wallet is not installed or connected.');
      }

      const result = await window.$onekey!.stellar!.signMessage(message, {
        address: options.address,
        networkPassphrase: options.network,
      });

      return result.signedMessage;
    } catch (error) {
      throw new Error('BLUX: Failed to sign message with Onekey.');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (typeof window === 'undefined' || !window.$onekey?.stellar) {
        throw new Error('BLUX: Onekey Wallet is not installed or connected.');
      }

      const result = await window.$onekey!.stellar!.signTransaction(xdr, {
        submit: false,
        address: options.address,
        networkPassphrase: options.network,
      });

      return result.signedTxXdr;
    } catch (error) {
      throw new Error('BLUX: Failed to sign the transaction with Onekey.');
    }
  },
};
