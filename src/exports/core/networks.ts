import { Networks } from "@stellar/stellar-sdk";

const networks = {
  mainnet: Networks.PUBLIC,
  testnet: Networks.TESTNET,
  sandbox: Networks.SANDBOX,
  futurenet: Networks.FUTURENET,
  standalone: Networks.STANDALONE,
};

export default networks;
