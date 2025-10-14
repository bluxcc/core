import { Horizon, StrKey } from '@stellar/stellar-sdk';

import { checkConfigCreated, getAddress, getNetwork } from '../utils';

export type GetBalancesOptions = {
  address?: string;
  network?: string;
  includeZeroBalances?: boolean;
};

export type GetBalancesResult = Horizon.HorizonApi.BalanceLine[];

export const getBalances = async (
  options: GetBalancesOptions,
): Promise<GetBalancesResult> => {
  checkConfigCreated();
  const address = getAddress(options.address);
  const { horizon } = getNetwork(options.network);

  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error('Invalid address');
  }

  try {
    const account = await horizon.loadAccount(address);

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
