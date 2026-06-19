import { StellarNetwork, SupportedWallet } from '../enums';
import { IWallet } from '../types';

export const rabetConfig: IWallet = {
  name: SupportedWallet.Rabet,
  website: 'https://rabet.io',

  connect: async () => {
    try {
      if (!window.rabet)
        throw new Error('BLUX: Rabet Wallet is not installed.');

      const result = await window.rabet.connect();

      return result.publicKey;
    } catch (e) {
      throw new Error('BLUX: Failed to connect to Rabet.');
    }
  },
  disconnect: async () => {
    try {
      if (!window.rabet)
        throw new Error('BLUX: Rabet Wallet is not installed.');

      window.rabet.disconnect();
    } catch { }
  },
  getNetwork: async () => {
    try {
      if (!window.rabet)
        throw new Error('BLUX: Rabet Wallet is not installed.');

      const network = await window.rabet.getNetwork();

      return network;
    } catch (error) {
      throw new Error('BLUX: Failed to getNetwork from Rabet');
    }
  },
  isAvailable: () =>
    new Promise((resolve) => {
      setTimeout(
        () => resolve(typeof window !== 'undefined' && !!window.rabet),
        150,
      );
    }),
  signAuthEntry: async () => {
    throw new Error('BLUX: Rabet does not support the signAuthEntry function');
  },
  signMessage: async (message, _) => {
    try {
      if (!window.rabet)
        throw new Error('BLUX: Rabet Wallet is not installed.');

      const signedMessage = await window.rabet.signMessage(message);

      if (!signedMessage.message || signedMessage.error) {
        throw new Error('BLUX: Failed to signMessage from Rabet');
      }

      return signedMessage.message;
    } catch (error) {
      throw new Error('BLUX: Failed to signMessage from Rabet');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (!window.rabet)
        throw new Error('BLUX: Rabet Wallet is not installed.');

      const result = await window.rabet.sign(
        xdr,
        options.network === StellarNetwork.PUBLIC ? 'mainnet' : 'testnet',
      );

      return result.xdr;
    } catch (error) {
      throw new Error('BLUX: Failed to sign the transaction with Rabet.');
    }
  },
};
