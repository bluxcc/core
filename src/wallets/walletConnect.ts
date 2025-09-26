import { IWallet } from '../types';
import { getState } from '../store';
import { SupportedWallet } from '../enums';

/*
 * todos:
 * 1. fix error messages
 * 2. getNetwork implementations
 * 3. signMessage
 * 4. signAuthEntryo
 * 5. signTransaction full test
 * 5. disconnect full test
 */
export const walletConnectConfig: IWallet = {
  name: SupportedWallet.WalletConnect,
  website: 'https://walletconnect.com',

  connect: async () => {
    const { walletConnect } = getState();

    if (!walletConnect) {
      throw new Error('no wc is set up');
    }

    try {
      const session = await walletConnect.connection.approval();

      return { publicKey: session.self.publicKey };
    } catch {
      throw new Error('error connecting to wallet connect');
    }
  },
  disconnect: async () => {
    const { walletConnect } = getState();

    if (!walletConnect) {
      throw new Error('no wc is set up');
    }

    try {
      await walletConnect.client.disconnect({
        topic: walletConnect.client.session.getAll()[0].topic,
        reason: {
          code: 6000,
          message: 'User disconnected.',
        },
      });
    } catch {
      throw new Error('Failed to disconnect from Wallet Connect.');
    }
  },
  getNetwork: async () => {
    throw new Error('no support');
  },
  isAvailable: async () => {
    const { config } = getState();

    return !!config.walletConnect;
  },
  signTransaction: async (xdr, options) => {
    const { walletConnect } = getState();

    if (!walletConnect) {
      throw new Error('no wc is set up');
    }

    try {
      if (!walletConnect.client.session.getAll()) {
        throw new Error('WalletConnect not connected.');
      }

      const session = walletConnect.client.session.getAll()[0];

      // TODO: use options.network and options.address to sign the transaction.
      // WC might choose a wrong account/network, so we need to be sure.
      const response = await walletConnect.client.request({
        topic: session.topic,
        chainId: 'stellar:public',
        request: {
          method: 'stellar_signTransaction',
          params: { xdr },
        },
      });

      return response as string;
    } catch {
      throw new Error('Failed to sign the transaction with Wallet Connect.');
    }
  },
};
