import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const hanaConfig: IWallet = {
  name: SupportedWallet.Hana,
  website: 'https://www.hanawallet.io/',
  authenticateWithSignedMessage: true,

  connect: async () => {
    try {
      if (!(await window.hanaWallet!.stellar!.getPublicKey())) {
        throw new Error('BLUX: Hana Wallet is not installed or connected.');
      }

      const publicKey = await window.hanaWallet!.stellar!.getPublicKey();

      return publicKey;
    } catch (error) {
      throw new Error('BLUX: Failed to connect to HanaWallet.');
    }
  },
  disconnect: async () => { },
  getNetwork: async () => {
    try {
      if (!window.hanaWallet?.stellar)
        throw new Error('BLUX: Hana Wallet is not installed.');

      const networkDetails =
        await window.hanaWallet.stellar.getNetworkDetails();

      return {
        network: networkDetails.network,
        passphrase: networkDetails.networkPassphrase,
      };
    } catch {
      throw new Error('BLUX: Failed to getNetwork using HanaWallet');
    }
  },
  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.hanaWallet?.stellar;
  },
  signAuthEntry: async (authEntry, options) => {
    const isAvailable =
      typeof window !== 'undefined' && !!window.hanaWallet?.stellar;

    if (!isAvailable) {
      throw new Error('BLUX: Failed to signAuthEntry using HanaWallet');
    }

    try {
      const signedAuthEntry = await window.hanaWallet!.stellar!.signAuthEntry({
        xdr: authEntry,
        accountToSign: options.address,
      });

      return signedAuthEntry;
    } catch {
      throw new Error('BLUX: Failed to signAuthEntry using HanaWallet');
    }
  },
  signMessage: async (message, options) => {
    const isAvailable =
      typeof window !== 'undefined' && !!window.hanaWallet?.stellar;

    if (!isAvailable) {
      throw new Error('BLUX: Failed to signMessage using HanaWallet');
    }

    try {
      // Hana's signMessage is raw ed25519, not SEP-53. Pre-hash and signBlob.
      const payload = Buffer.concat([
        Buffer.from('Stellar Signed Message:\n', 'utf8'),
        Buffer.from(message, 'utf8'),
      ]);
      const digest = Buffer.from(
        await crypto.subtle.digest('SHA-256', payload),
      );

      // @ts-ignore
      return await window.hanaWallet!.stellar!.signBlob({
        blob: digest.toString('base64'),
        accountToSign: options.address,
      });
    } catch {
      throw new Error('BLUX: Failed to signMessage using HanaWallet');
    }
  },
  signTransaction: async (xdr, options) => {
    const isAvailable =
      typeof window !== 'undefined' && !!window.hanaWallet?.stellar;

    if (!isAvailable) {
      throw new Error('BLUX: Failed to signTransaction using HanaWallet');
    }

    try {
      const signFn = window?.hanaWallet?.stellar?.signTransaction;

      if (typeof signFn !== 'function') {
        throw new Error('BLUX: Failed to signTransaction using HanaWallet');
      }

      return await signFn({
        xdr,
        // @ts-ignore
        address: options.address,
        networkPassphrase: options.network,
      });
    } catch (error) {
      throw new Error('BLUX: Failed to signTransaction using HanaWallet');
    }
  },
};
