import { Horizon } from '@stellar/stellar-sdk';

import { resolveAddress } from './helpers';
import { checkConfigCreated, getAddress, getNetwork } from '../utils';

/** Options for {@link getAccount}. */
export type GetAccountOptions = {
  /**
   * Account to load: a Stellar address (`G...`/`M...`) or a SEP-2 federated
   * address (`name*domain.com`). Defaults to the logged-in account.
   */
  address?: string;
  /** Network passphrase to query. Defaults to the active network. */
  network?: string;
};

/** The loaded account, or `null` when it does not exist on-chain. */
export type GetAccountResult = Horizon.AccountResponse | null;

/**
 * Loads a single account from Horizon, resolving federated addresses first.
 *
 * @param options - Which account to load and on which network.
 * @returns The account record, or `null` if it is not found / not yet funded.
 * @throws If `address` is neither a valid Stellar address nor a resolvable federated address.
 */
export const getAccount = async (
  options: GetAccountOptions,
): Promise<GetAccountResult> => {
  checkConfigCreated();

  const { publicKey } = await resolveAddress(getAddress(options.address));
  const { horizon } = getNetwork(options.network);

  try {
    const account = await horizon.loadAccount(publicKey);

    return account;
  } catch {
    return null;
  }
};
