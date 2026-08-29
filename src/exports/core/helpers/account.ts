import { Asset, Horizon } from '@stellar/stellar-sdk';

/**
 * Loads an account from Horizon, returning `null` instead of throwing when the
 * account does not exist on the network yet.
 *
 * @param horizon - The Horizon server to query.
 * @param address - The account id (`G...`) to load.
 * @returns The account, or `null` if it is not found.
 */
const isAccountMissing = (error: unknown): boolean => {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const status = (error as { response?: { status?: number } }).response?.status;
  const message = error instanceof Error ? error.message : '';

  return status === 404 || /account not found/i.test(message);
};

export const loadAccount = async (
  horizon: Horizon.Server,
  address: string,
): Promise<Horizon.AccountResponse | null> => {
  try {
    return await horizon.loadAccount(address);
  } catch (error) {
    if (isAccountMissing(error)) {
      return null;
    }

    throw error;
  }
};

/**
 * Reports whether `account` can receive `asset` directly: always true for the
 * native asset, otherwise true only when the account already holds a trustline
 * for that exact code + issuer.
 *
 * @param account - The recipient account.
 * @param asset - The asset to check.
 * @returns `true` if a direct payment of `asset` would be accepted.
 */
export const hasTrustline = (
  account: Horizon.AccountResponse,
  asset: Asset,
): boolean => {
  if (asset.isNative()) {
    return true;
  }

  return account.balances.some(
    (balance) =>
      (balance.asset_type === 'credit_alphanum4' ||
        balance.asset_type === 'credit_alphanum12') &&
      balance.asset_code === asset.getCode() &&
      balance.asset_issuer === asset.getIssuer(),
  );
};
