import { IWallet } from '../types';
import { getState } from '../store';
import { StellarNetwork, SupportedWallet } from '../enums';

// The WalletConnect CAIP-2 chain IDs for Stellar
const STELLAR_PUBNET_CAIP = 'stellar:pubnet';
const STELLAR_TESTNET_CAIP = 'stellar:testnet';

export const walletConnectConfig: IWallet = {
  name: SupportedWallet.WalletConnect,
  website: 'https://walletconnect.com',

  isAvailable: async () => {
    const { config } = getState();
    return !!config.walletConnect;
  },

  connect: async () => {
    const { walletConnect } = getState();

    if (!walletConnect || !walletConnect.client) {
      throw new Error(
        'WalletConnect client is not set up. Please check your store configuration.',
      );
    }

    try {
      const session = await walletConnect.client.connect({
        optionalNamespaces: {
          stellar: {
            methods: [
              'stellar_signXDR',
              'stellar_signAndSubmitXDR',
              'stellar_signMessage',
            ],
            chains: [STELLAR_PUBNET_CAIP, STELLAR_TESTNET_CAIP],
            events: [],
          },
        },
      });

      const approval = await session.approval();

      const stellarNamespace = approval.namespaces.stellar;
      if (!stellarNamespace || !stellarNamespace.accounts[0]) {
        throw new Error(
          'Wallet did not approve the required Stellar namespace/account.',
        );
      }

      const account = stellarNamespace.accounts[0].split(':').pop();

      return { publicKey: account as string };
    } catch (e) {
      console.error('WalletConnect connection error:', e);
      throw new Error(
        'Failed to connect to Wallet. Ensure your wallet supports Stellar WalletConnect.',
      );
    }
  },

  disconnect: async () => {
    const { walletConnect } = getState();

    if (!walletConnect || !walletConnect.client) {
      throw new Error('WalletConnect client is not set up.');
    }

    try {
      const activeSessions = walletConnect.client.session.getAll();
      if (activeSessions.length === 0) {
        return;
      }

      // Disconnect the first active session
      await walletConnect.client.disconnect({
        topic: activeSessions[0].topic,
        reason: {
          code: 6000,
          message: 'User explicitly disconnected.',
        },
      });
    } catch (e) {
      console.error('WalletConnect disconnect error:', e);
      throw new Error(
        'Failed to disconnect from Wallet Connect. Try closing the session in your mobile wallet.',
      );
    }
  },

  getNetwork: async () => {
    throw new Error(
      'Cannot reliably get the active network from WalletConnect without a specific session request.',
    );
  },

  signTransaction: async (
    xdr: string,
    options: { networkPassphrase?: string; address?: string } = {},
  ) => {
    const { walletConnect } = getState();

    if (!walletConnect || !walletConnect.client) {
      throw new Error('WalletConnect client is not set up.');
    }

    try {
      const activeSessions = walletConnect.client.session.getAll();
      if (activeSessions.length === 0) {
        throw new Error('WalletConnect not connected. Please connect first.');
      }
      const session = activeSessions[0];

      const chainId =
        options.networkPassphrase === StellarNetwork.PUBLIC
          ? STELLAR_PUBNET_CAIP
          : STELLAR_TESTNET_CAIP;

      const response = await walletConnect.client.request({
        topic: session.topic,
        chainId: chainId,
        request: {
          method: 'stellar_signAndSubmitXDR',
          params: {
            xdr,
          },
        },
      });

      return response as string;
    } catch (e) {
      console.error('WalletConnect signTransaction error:', e);
      throw new Error(
        'Failed to sign and submit the transaction with Wallet Connect. See console for details.',
      );
    }
  },

  signMessage: async (
    message: string,
    options: { address: string; networkPassphrase: string },
  ) => {
    const { walletConnect } = getState();

    if (!walletConnect || !walletConnect.client) {
      throw new Error('WalletConnect client is not set up.');
    }

    try {
      const activeSessions = walletConnect.client.session.getAll();
      if (activeSessions.length === 0) {
        throw new Error('WalletConnect not connected. Please connect first.');
      }
      const session = activeSessions[0];

      const chainId =
        session.namespaces.stellar?.chains[0] || STELLAR_PUBNET_CAIP;

      const response = await walletConnect.client.request({
        topic: session.topic,
        chainId: chainId,
        request: {
          method: 'stellar_signMessage',
          params: {
            message: message,
          },
        },
      });

      return response as string;
    } catch (e) {
      console.error('WalletConnect signMessage error:', e);
      throw new Error('Failed to sign message with Wallet Connect.');
    }
  },

  signAuthEntry: async () => {
    throw new Error(
      'Stellar Auth Entry signing is not supported via standard WalletConnect methods.',
    );
  },
};
