declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

interface OneKeyApi {
  getPublicKey(): Promise<string>;
  signMessage(
    msg: string,
    options?: { networkPassphrase: string; address: string },
  ): Promise<{ signedMessage: string }>;

  signTransaction(
    xdr: string,
    options?: {
      submit: boolean;
      address: string;
      networkPassphrase: string;
    },
  ): Promise<{ signedTxXdr: string }>;

  signAuthEntry(
    xdr: string,
    options?: { networkPassphrase: string; address: string },
  ): Promise<{ signedAuthEntry: string }>;

  getNetwork(): Promise<{
    network: string;
    networkPassphrase: string;
  }>;
}

interface BitgetApi {
  connect(): Promise<string>;

  network(): Promise<{
    network: string;
    networkPassphrase: string;
  }>;

  signMessage(msg: string, address?: string): Promise<string>;

  signTransaction(
    xdr: string,
    options?: {
      address: string;
      networkPassphrase: string;
    },
  ): Promise<string>;
}

interface KleverApi {
  getAddress(params?: {
    path?: string;
    skipRequestAccess?: boolean;
  }): Promise<{ address: string }>;
  signTransaction(
    xdr: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
      submit?: boolean;
      submitUrl?: string;
    },
  ): Promise<{ signedTxXdr: string; signerAddress?: string }>;
  signAuthEntry(
    authEntry: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<{ signedAuthEntry: string; signerAddress?: string }>;
  signMessage(
    message: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
      path?: string;
    },
  ): Promise<{ signedMessage: string; signerAddress?: string }>;
  getNetwork(): Promise<{ network: string; networkPassphrase: string }>;
  disconnect?(): Promise<void>;
}

interface CactusLinkApi {
  isConnected(): Promise<{ isConnected: boolean; error?: string }>;
  requestAccess(): Promise<{ error?: string }>;
  getAddress(): Promise<{ address: string; error?: string }>;
  signTransaction(
    xdr: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
    },
  ): Promise<{ signedTxXdr: string }>;
  signAuthEntry(
    authEntry: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
    },
  ): Promise<{ signedAuthEntry: string }>;
  signMessage(
    message: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
    },
  ): Promise<{ signedMessage: string }>;
  getNetwork(): Promise<{
    network: string;
    networkPassphrase: string;
    error?: string;
  }>;
}

interface FreighterApi {
  isConnected: () => Promise<{ isConnected: boolean }>;
  requestAccess: () => Promise<{ address: string }>;
  signTransaction: (
    transactionXdr: string,
    opts?: {
      networkPassphrase?: string;
      address?: string;
    },
  ) => Promise<{
    signedTxXdr: string;
    signerAddress: string;
  }>;
}

declare global {
  interface Window {
    bitkeep?: {
      stellar?: BitgetApi;
    };
    $onekey?: {
      stellar?: OneKeyApi;
    };
    kleverWallet?: {
      stellar?: KleverApi;
    };
    cactuslink_stellar?: CactusLinkApi;
    isFordefi?: boolean;
    FordefiProviders?: {
      StellarProvider?: unknown;
    };
    xBullSDK?: {
      connect(params?: {
        canRequestPublicKey: boolean;
        canRequestSign: boolean;
      }): Promise<string>;
      getPublicKey(): Promise<string>;
      signXDR(
        xdr: string,
        params?: {
          network?: string;
          publicKey?: string;
        },
      ): Promise<string>;
      signMessage(
        message: string,
        params?: {
          address?: string;
          networkPassphrase?: string;
        },
      ): Promise<{ error?: any; signedMessage?: string }>;
      getNetwork(): Promise<{ networkPassphrase: string; network: string }>;
    };
    freighterApiSDK?: FreighterApi;
    rabet?: {
      sign(
        xdr: string,
        network: 'mainnet' | 'testnet',
      ): Promise<{
        xdr: string;
        network: 'mainnet' | 'testnet';
      }>;
      signMessage(
        message: string,
      ): Promise<{ message: string; error?: string }>;
      disconnect(): Promise<void>;
      connect: () => Promise<{ publicKey: string }>;
      getNetwork: () => Promise<{ network: string; passphrase: string }>;
    };
    hanaWallet?: {
      stellar?: {
        getPublicKey(): Promise<string>;
        getNetworkDetails(): Promise<{
          network: string;
          networkPassphrase: string;
          networkUrl: string;
          sorobanRpcUrl: string;
        }>;
        signAuthEntry({
          xdr,
          accountToSign,
        }: SignTransactionProps): Promise<string>;
        signMessage({
          xdr,
          accountToSign,
        }: SignTransactionProps): Promise<string>;
        signTransaction({
          xdr,
          accountToSign,
          networkPassphrase,
        }: SignTransactionProps): Promise<string>;
      };
    };
  }
}

export { };
