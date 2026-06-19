import { Networks } from '@stellar/stellar-sdk';

/**
 * Convenience map of friendly network names to their Stellar passphrases. Pass a
 * value from here as the `network` option on any core function or to
 * {@link switchNetwork}.
 */
export const networks = {
  /** Public network (mainnet) passphrase. */
  mainnet: Networks.PUBLIC,
  /** Testnet passphrase. */
  testnet: Networks.TESTNET,
  /** Sandbox passphrase. */
  sandbox: Networks.SANDBOX,
  /** Futurenet passphrase. */
  futurenet: Networks.FUTURENET,
  /** Standalone (local) network passphrase. */
  standalone: Networks.STANDALONE,
};
