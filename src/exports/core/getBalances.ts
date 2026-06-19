import { Horizon } from '@stellar/stellar-sdk';

import { resolveAddress } from './helpers';
import { checkConfigCreated, getAddress, getNetwork } from '../utils';

/** Options for {@link getBalances}. */
export type GetBalancesOptions = {
  /**
   * Account whose balances to read: a Stellar address (`G...`/`M...`) or a SEP-2
   * federated address. Defaults to the logged-in account.
   */
  address?: string;
  /** Network passphrase to query. Defaults to the active network. */
  network?: string;
  /** Keep balance lines whose balance is exactly zero. Defaults to `false`. */
  includeZeroBalances?: boolean;
};

/** The account's balance lines, with the native (XLM) line first when present. */
export type GetBalancesResult = Horizon.HorizonApi.BalanceLine[];

/**
 * Reads an account's asset balances, resolving federated addresses first.
 *
 * @param options - Which account to read and on which network.
 * @returns The balance lines (native first), or an empty array if the account is not found.
 * @throws If `address` is neither a valid Stellar address nor a resolvable federated address.
 */
export const getBalances = async (
  options: GetBalancesOptions,
): Promise<GetBalancesResult> => {
  checkConfigCreated();

  const { publicKey } = await resolveAddress(getAddress(options.address));
  const { horizon } = getNetwork(options.network);

  try {
    const account = await horizon.loadAccount(publicKey);

    if (options.includeZeroBalances) {
      return account.balances;
    }

    const result = account.balances.filter((b) => Number(b.balance) !== 0);

    const xlm = result.find((x) => x.asset_type === 'native');
    const abcd = result.filter((x) => x.asset_type !== 'native');

    if (xlm) {
      return [xlm, ...abcd];
    }

    return abcd;
  } catch {
    return [];
  }
};
