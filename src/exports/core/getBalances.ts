import { Horizon, StrKey } from "@stellar/stellar-sdk";

import { checkConfigCreated, getAddress, getNetwork } from "../utils";

type GetBalanceOptions = {
  address?: string;
  network?: string;
  includeZeroBalances?: boolean;
};

const getBalances = async (
  options: GetBalanceOptions,
): Promise<Horizon.HorizonApi.BalanceLine[]> => {
  checkConfigCreated();
  const address = getAddress(options.address);
  const { horizon } = getNetwork(options.network);

  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error("Invalid address");
  }

  try {
    const account = await horizon.loadAccount(address);

    if (options.includeZeroBalances) {
      return account.balances;
    }

    return account.balances.filter((b) => Number(b.balance) !== 0);
  } catch {
    return [];
  }
};

export default getBalances;
