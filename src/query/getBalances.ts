import { Horizon, StrKey } from "@stellar/stellar-sdk";

import { checkConfigCreated, getAddress, getNetwork } from "./utils";

type GetBalanceOptions = {
  address?: string;
  network?: string;
};

type GetBalanceResult = Horizon.HorizonApi.BalanceLine[];

const getBalances = async (
  options: GetBalanceOptions,
): Promise<GetBalanceResult> => {
  checkConfigCreated();
  const address = getAddress(options.address);
  const { horizon } = getNetwork(options.network);

  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error("Invalid address");
  }

  try {
    const account = await horizon.loadAccount(address);

    return account.balances;
  } catch {
    return [];
  }
};

export default getBalances;
