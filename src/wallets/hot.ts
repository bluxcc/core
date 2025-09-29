import { HOT } from '@hot-wallet/sdk';

import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

export const hotConfig: IWallet = {
  name: SupportedWallet.Hot,
  website: 'https://hot-labs.org/',

  connect: async () => {
    try {
      const result = await HOT.request('stellar:getAddress', {});

      return result.address;
    } catch {
      throw new Error('Failed to connect to Hana wallet.');
    }
  },
  disconnect: async () => {},
  getNetwork: async () => {
    throw new Error('HotWallet does not support the getNetwork function');
  },
  isAvailable: async () => {
    return typeof window !== 'undefined' && !!window.hotExtension;
  },
  signAuthEntry: async (authEntry, options) => {
    try {
      const result = await HOT.request('stellar:signAuthEntry', {
        authEntry,
        accountToSign: options.address,
      });

      return result.signedAuthEntry;
    } catch {
      throw new Error('Failed to signAuthEntry using HotWallet');
    }
  },
  signMessage: async (message, options) => {
    try {
      const result = await HOT.request('stellar:signMessage', {
        message,
        accountToSign: options.address,
      });

      return result.signedMessage;
    } catch {
      throw new Error('Failed to signMessage using HotWallet');
    }
  },
  signTransaction: async (
    xdr: string,
    options: { address?: string; networkPassphrase?: string } = {},
  ): Promise<string> => {
    try {
      const result = await HOT.request('stellar:signTransaction', {
        xdr,
        accountToSign: options.address,
      });

      return result.signedTxXdr;
    } catch {
      throw new Error('Failed to signTransaction using HotWallet');
    }
  },
};
