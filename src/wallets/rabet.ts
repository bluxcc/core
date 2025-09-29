import { StellarNetwork, SupportedWallet } from '../enums';
import { IWallet } from '../types';

export const rabetConfig: IWallet = {
  name: SupportedWallet.Rabet,
  website: 'https://rabet.io',

  connect: async () => {
    try {
      if (!window.rabet) throw new Error('Rabet Wallet is not installed.');

      const result = await window.rabet.connect();

      return result.publicKey;
    } catch {
      throw new Error('Failed to connect to Rabet.');
    }
  },
  disconnect: async () => {
    try {
      if (!window.rabet) throw new Error('Rabet Wallet is not installed.');

      window.rabet.disconnect();
    } catch {}
  },
  getNetwork: async () => {
    try {
      if (!window.rabet) throw new Error('Rabet Wallet is not installed.');

      const network = await window.rabet.getNetwork();

      return network;
    } catch (error) {
      throw new Error('Failed to getNetwork from Rabet');
    }
  },
  isAvailable: () =>
    new Promise((resolve) => {
      setTimeout(
        () => resolve(typeof window !== 'undefined' && !!window.rabet),
        250,
      );
    }),
  signAuthEntry: async () => {
    throw new Error('Rabet does not support the signAuthEntry function');
  },
  signMessage: async () => {
    throw new Error('Rabet does not support the signMessage function');
  },
  signTransaction: async (xdr, options) => {
    try {
      if (!window.rabet) throw new Error('Rabet Wallet is not installed.');

      const result = await window.rabet.sign(
        xdr,
        options.network === StellarNetwork.PUBLIC ? 'mainnet' : 'testnet',
      );

      return result.xdr;
    } catch (error) {
      throw new Error('Failed to sign the transaction with Rabet.');
    }
  },
};
