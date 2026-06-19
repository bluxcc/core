import { Horizon } from '@stellar/stellar-sdk';
import { AccountCallBuilder } from '@stellar/stellar-sdk/lib/esm/horizon/account_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, resolveAddressKey, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Filter fields for {@link getAccounts}; at least one must be provided. */
type GetAccountsFilters = {
  /** Accounts that list this key as a signer (address or federated address). */
  forSigner?: string;
  /** Accounts holding a trustline to this asset (`'xlm'`, `'CODE:ISSUER'`, or an `Asset`). */
  forAsset?: AssetArg;
  /** Accounts sponsored by this account id. */
  sponsor?: string;
  /** Accounts participating in this liquidity pool id. */
  forLiquidityPool?: string;
};

/**
 * Requires at least one key of `T` to be present while keeping the rest
 * optional — Horizon's `/accounts` endpoint must be filtered by something.
 */
type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>;
}[keyof T];

/** Options for {@link getAccounts}: pagination plus at least one filter. */
export type GetAccountsOptions = CallBuilderOptions &
  RequireAtLeastOne<GetAccountsFilters>;

/** The Horizon call builder plus the first page of accounts. */
export type GetAccountsResult = {
  builder: AccountCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.AccountRecord>;
};

/**
 * Lists accounts filtered by signer, asset trustline, sponsor, or liquidity
 * pool. At least one filter is required by Horizon.
 *
 * @param options - At least one filter, plus pagination and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getAccounts = async (
  options: GetAccountsOptions,
): Promise<GetAccountsResult> => {
  checkConfigCreated();

  let builder = callBuilder('accounts', [], options);

  const [forSigner, sponsor] = await Promise.all([
    resolveAddressKey(options.forSigner),
    resolveAddressKey(options.sponsor),
  ]);

  if (forSigner) {
    builder = builder.forSigner(forSigner);
  }

  if (options.forAsset) {
    builder = builder.forAsset(resolveAsset(options.forAsset));
  }

  if (sponsor) {
    builder = builder.sponsor(sponsor);
  }

  if (options.forLiquidityPool) {
    builder = builder.forLiquidityPool(options.forLiquidityPool);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
