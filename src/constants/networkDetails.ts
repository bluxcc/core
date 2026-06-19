import { Networks } from "@stellar/stellar-sdk";

export interface INetworkTransports {
  name: string;
  horizon: string;
  soroban: string;
}

export const networks = {
  mainnet: Networks.PUBLIC,
  testnet: Networks.TESTNET,
  sandbox: Networks.SANDBOX,
  futurenet: Networks.FUTURENET,
  standalone: Networks.STANDALONE,
};

// Human-readable name for every known network passphrase. Unlike
// DEFAULT_NETWORKS_TRANSPORTS this also covers Standalone and Sandbox, which
// have no default transports but still need a display label.
export const NETWORK_DISPLAY_NAMES: Record<string, string> = {
  [networks.mainnet]: "Mainnet",
  [networks.testnet]: "Testnet",
  [networks.futurenet]: "Futurenet",
  [networks.standalone]: "Standalone",
  [networks.sandbox]: "Sandbox",
};

export const DEFAULT_NETWORKS_TRANSPORTS: Record<string, INetworkTransports> = {
  [networks.mainnet]: {
    name: "Mainnet",
    horizon: "https://horizon.stellar.org",
    soroban: "https://mainnet.sorobanrpc.com",
  },
  [networks.testnet]: {
    name: "Testnet",
    horizon: "https://horizon-testnet.stellar.org",
    soroban: "https://soroban-testnet.stellar.org",
  },
  [networks.futurenet]: {
    name: "Futurenet",
    horizon: "https://horizon-futurenet.stellar.org",
    soroban: "https://rpc-futurenet.stellar.org",
  },
};
