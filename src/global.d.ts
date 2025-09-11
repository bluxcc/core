declare module "*.css" {
  const content: { [className: string]: string };
  export default content;
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
      getNetwork(): Promise<{ networkPassphrase: string; network: string }>;
    };
    freighterApiSDK?: FreighterApi;
    rabet?: {
      sign(
        xdr: string,
        network: "mainnet" | "testnet",
      ): Promise<{
        xdr: string;
        network: "mainnet" | "testnet";
      }>;
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
