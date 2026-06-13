import { IWallet } from '../types';
import { SupportedWallet } from '../enums';

/**
 * The Fordefi browser extension can optionally impersonate the Freighter
 * wallet (controlled by a user-facing toggle in extension settings). When
 * impersonation is enabled, the extension listens for the standard Freighter
 * postMessage protocol (FREIGHTER_EXTERNAL_MSG_REQUEST /
 * FREIGHTER_EXTERNAL_MSG_RESPONSE) so that dapps using
 * @stellar/freighter-api work transparently.
 *
 * This config reuses that same postMessage protocol to communicate with the
 * extension, while detecting Fordefi specifically via window.FordefiProviders
 * (which the extension always injects regardless of impersonation settings).
 * This allows showing "Fordefi" as a distinct wallet option even when
 * Freighter impersonation is active.
 */

const FREIGHTER_EXTERNAL_MSG_REQUEST = 'FREIGHTER_EXTERNAL_MSG_REQUEST';
const FREIGHTER_EXTERNAL_MSG_RESPONSE = 'FREIGHTER_EXTERNAL_MSG_RESPONSE';

let messageCounter = 0;

const sendFordefiMessage = <T>(
  type: string,
  params?: Record<string, unknown>,
): Promise<T> =>
  new Promise((resolve, reject) => {
    const messageId = ++messageCounter;

    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.source !== FREIGHTER_EXTERNAL_MSG_RESPONSE) return;
      // Freighter uses "messagedId" (typo with an extra 'd') in responses
      if (event.data?.messagedId !== messageId) return;

      window.removeEventListener('message', handler);

      if (event.data.apiError) {
        reject(event.data.apiError);
      } else {
        resolve(event.data as T);
      }
    };

    window.addEventListener('message', handler);

    window.postMessage(
      {
        source: FREIGHTER_EXTERNAL_MSG_REQUEST,
        messageId,
        type,
        ...params,
      },
      window.location.origin,
    );
  });

const isFordefiInstalled = () =>
  typeof window !== 'undefined' && !!window.FordefiProviders?.StellarProvider;

export const fordefiConfig: IWallet = {
  name: SupportedWallet.Fordefi,
  website: 'https://www.fordefi.com',

  connect: async () => {
    try {
      if (!isFordefiInstalled()) {
        throw new Error('BLUX: Fordefi Wallet is not installed.');
      }

      const { publicKey } = await sendFordefiMessage<{ publicKey: string }>(
        'REQUEST_ACCESS',
      );

      if (!publicKey) {
        throw new Error('BLUX: Failed to get address from Fordefi.');
      }

      return publicKey;
    } catch {
      throw new Error('BLUX: Failed to connect to Fordefi.');
    }
  },
  disconnect: async () => { },
  getNetwork: async () => {
    try {
      if (!isFordefiInstalled()) {
        throw new Error('BLUX: Fordefi Wallet is not installed.');
      }

      const { networkDetails } = await sendFordefiMessage<{
        networkDetails: { network: string; networkPassphrase: string };
      }>('REQUEST_NETWORK_DETAILS');

      return {
        network: networkDetails.network,
        passphrase: networkDetails.networkPassphrase,
      };
    } catch {
      throw new Error('BLUX: Failed to get network from Fordefi');
    }
  },
  isAvailable: async () => {
    return isFordefiInstalled();
  },
  signAuthEntry: async () => {
    throw new Error('BLUX: Fordefi does not support the signAuthEntry function');
  },
  signMessage: async (message, options) => {
    try {
      if (!isFordefiInstalled()) {
        throw new Error('BLUX: Fordefi Wallet is not installed.');
      }

      const { signedBlob } = await sendFordefiMessage<{
        signedBlob: string | null;
        signerAddress: string;
      }>('SUBMIT_BLOB', {
        blob: message,
        networkPassphrase: options.network,
        accountToSign: options.address,
      });

      if (!signedBlob) {
        throw new Error('BLUX: Failed to sign message with Fordefi.');
      }

      return signedBlob;
    } catch {
      throw new Error('BLUX: Failed to sign message with Fordefi.');
    }
  },
  signTransaction: async (xdr, options) => {
    try {
      if (!isFordefiInstalled()) {
        throw new Error('BLUX: Fordefi Wallet is not installed.');
      }

      const { signedTransaction } = await sendFordefiMessage<{
        signedTransaction: string;
        signerAddress: string;
      }>('SUBMIT_TRANSACTION', {
        transactionXdr: xdr,
        networkPassphrase: options.network,
        accountToSign: options.address,
      });

      if (!signedTransaction) {
        throw new Error('BLUX: Failed to sign transaction with Fordefi.');
      }

      return signedTransaction;
    } catch {
      throw new Error('BLUX: Failed to sign the transaction with Fordefi.');
    }
  },
};
