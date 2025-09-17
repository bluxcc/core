import { Horizon, StrKey } from "@stellar/stellar-sdk";

import { checkConfigCreated, getAddress, getNetwork } from "./utils";

type GetAccountOptions = {
  address?: string;
  network?: string;
};

type GetAccountResult = Horizon.AccountResponse | null;

const getAccount = async (
  options: GetAccountOptions,
): Promise<GetAccountResult> => {
  checkConfigCreated();
  const address = getAddress(options.address);
  const { horizon } = getNetwork(options.network);

  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new Error("Invalid address");
  }

  try {
    const account = await horizon.loadAccount(address);

    return account;
  } catch {
    return null;
  }
};

export default getAccount;
