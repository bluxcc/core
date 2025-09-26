import Core from '@walletconnect/core';
import SignClient from '@walletconnect/sign-client';
import { IWallet, IStore } from '../types';
import { StellarNetwork, SupportedWallet } from '../enums';

// Use a class to manage state and ensure the client is initialized only once
class WalletConnectWallet {
  public name = SupportedWallet.WalletConnect;
  public website = 'https://walletconnect.com';

  private signClient: SignClient | null = null;
  private store: IStore;
  private uriCallback: (uri: string) => void;

  constructor(store: IStore, uriCallback: (uri: string) => void) {
    this.store = store;
    this.uriCallback = uriCallback;
  }

  isAvailable = async (): Promise<boolean> => {
    // WalletConnect is always available as it's a protocol, not a specific wallet app.
    return Promise.resolve(true);
  };

  connect = async (): Promise<void> => {
    if (this.signClient) {
      console.log('SignClient already initialized.');
      // Re-generate a new URI if needed, but avoid re-initializing the client
      // return this.signClient.connect(...);
    }

    try {
      const core = new Core({
        projectId: this.store.config.walletConnect?.projectId,
      });

      // Initialize SignClient and set up event listeners
      SignClient.init({
        core,
        metadata: {
          name: this.store.config.appName,
          url: this.store.config.walletConnect?.url ?? '',
          icons: this.store.config.walletConnect?.icons ?? [],
          description: this.store.config.walletConnect?.description ?? '',
        },
      })
        .then((signClient) => {
          this.signClient = signClient;
          console.log('SignClient initialized successfully.');

          // Set up listeners for session requests and disconnections
          this.signClient.on('session_request', (event) => {
            console.log('Session request received:', event);
            // Handle signing request...
          });

          this.signClient.on('session_disconnect', (event) => {
            console.log('Session disconnected:', event);
            // Clean up state...
          });

          // Start the connection process
          return this.signClient.connect({
            requiredNamespaces: {
              // Note: WalletConnect does not have native Stellar support.
              // Stellar uses the 'stellar' namespace, not eip155.
              // This example uses eip155 for demonstration, assuming a multi-chain app.
              eip155: {
                chains: ['eip155:1'], // e.g., Ethereum Mainnet
                methods: ['eth_sendTransaction', 'personal_sign'],
                events: ['chainChanged', 'accountsChanged'],
              },
            },
          });
        })
        .then(({ uri, approval }) => {
          console.log('Connection URI generated:', uri);
          this.uriCallback(uri); // Pass URI to a callback function to update your UI

          approval()
            .then((session) => {
              console.log('Session established:', session.self.publicKey);
              // Handle successful session...
            })
            .catch((error) => {
              console.error('Connection rejected by wallet:', error);
              // Handle rejected connection...
            });
        })
        .catch((error) => {
          console.error('Initialization or connection failed:', error);
          throw new Error('Failed to connect to Wallet Connect.');
        });
    } catch (error) {
      console.error('WalletConnect connection failed unexpectedly:', error);
      throw new Error('Failed to connect to Wallet Connect.');
    }
  };

  signTransaction = async (xdr: string, options = {}): Promise<string> => {
    // Placeholder for signing logic.
    // WalletConnect does not natively support XDR. This would require a custom method.
    try {
      if (!this.signClient || !this.signClient.session.getAll()) {
        throw new Error('WalletConnect not connected.');
      }
      // Your code to send a custom signing request
      const session = this.signClient.session.getAll()[0]; // Get the active session
      const response = await this.signClient.request({
        topic: session.topic,
        chainId: 'stellar:public', // Stellar chain ID
        request: {
          method: 'stellar_signTransaction',
          params: { xdr },
        },
      });
      return response as string;
    } catch (error) {
      console.error('Failed to sign the transaction:', error);
      throw new Error('Failed to sign the transaction with Wallet Connect.');
    }
  };

  disconnect = async (): Promise<void> => {
    try {
      if (this.signClient) {
        await this.signClient.disconnect({
          topic: this.signClient.session.getAll()[0].topic,
          reason: {
            code: 6000, // User disconnected
            message: 'User disconnected.',
          },
        });
        this.signClient = null;
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
      throw new Error('Failed to disconnect from Wallet Connect.');
    }
  };

  getNetwork = async (): Promise<StellarNetwork> => {
    // WalletConnect does not have a native method to get network.
    // This would likely be handled by a session request.
    return StellarNetwork.PUBLIC;
  };
}

// Helper function to create the wallet instance
export const createWalletConnect = (
  store: IStore,
  uriCallback: (uri: string) => void,
): IWallet => {
  return new WalletConnectWallet(store, uriCallback);
};
