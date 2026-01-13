import { IWallet } from '../types';
import { getState } from '../store';
import { SupportedWallet } from '../enums';
import { apiSignMessage, apiSignTransaction } from '../utils/api';

export const rabetConfig: IWallet = {
  name: SupportedWallet.Api,
  website: 'https://blux.cc',

  connect: async () => {
    throw new Error('API wallet is not defined.');
  },
  disconnect: async () => { },
  getNetwork: async () => {
    throw new Error('API wallet is not defined.');
  },
  isAvailable: async () => {
    return false;
  },
  signAuthEntry: async () => {
    throw new Error('API does not support the signAuthEntry function');
  },
  signMessage: async (message, _) => {
    try {
      const store = getState();

      const JWT = store.auth?.JWT;

      if (!JWT) {
        throw new Error('Failed to sign the message from API');
      }

      const res = await apiSignMessage(JWT, message);

      if (res.signature) {
        return res.signature;
      }

      throw new Error('Failed to sign the message from API');
    } catch (error) {
      throw new Error('Failed to sign the message from API');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      const store = getState();

      const JWT = store.auth?.JWT;

      if (!JWT) {
        throw new Error('Failed to sign the transaction from API');
      }

      const res = await apiSignTransaction(JWT, xdr, options.network);

      if (res.signed_xdr) {
        return res.signed_xdr;
      }

      throw new Error('Failed to sign the transaction from API');
    } catch (error) {
      throw new Error('Failed to sign the transaction from API.');
    }
  },
};
