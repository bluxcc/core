import { Networks } from "@stellar/stellar-sdk";

export interface INetworkTransports {
  name: string;
  horizon: string | any;
  soroban: string | any;
}

export const networks = {
  mainnet: Networks.PUBLIC,
  testnet: Networks.TESTNET,
  sandbox: Networks.SANDBOX,
  futurenet: Networks.FUTURENET,
  standalone: Networks.STANDALONE,
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
