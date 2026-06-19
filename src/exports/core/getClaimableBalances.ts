import { Horizon } from '@stellar/stellar-sdk';
import { ClaimableBalanceCallBuilder } from '@stellar/stellar-sdk/lib/horizon/claimable_balances_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, resolveAddressKey, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getClaimableBalances}. Extends the shared {@link CallBuilderOptions}. */
export type GetClaimableBalancesOptions = CallBuilderOptions & {
  /** Only balances of this asset (`'xlm'`, `'CODE:ISSUER'`, or an `Asset`). */
  asset: AssetArg;
  /** Only balances sponsored by this account id. */
  sponsor?: string;
  /** Only balances claimable by this account (address or federated address). */
  claimant: string;
};

/** The Horizon call builder plus the first page of claimable balances. */
export type GetClaimableBalancesResult = {
  builder: ClaimableBalanceCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.ClaimableBalanceRecord>;
};

/**
 * Lists claimable balances, scoped by asset and claimant (and optionally
 * sponsor).
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getClaimableBalances = async (
  options: GetClaimableBalancesOptions,
): Promise<GetClaimableBalancesResult> => {
  checkConfigCreated();

  let builder = callBuilder('claimableBalances', [], options);

  if (options.asset) {
    builder = builder.asset(resolveAsset(options.asset));
  }

  const [claimant, sponsor] = await Promise.all([
    resolveAddressKey(options.claimant),
    resolveAddressKey(options.sponsor),
  ]);

  if (claimant) {
    builder = builder.claimant(claimant);
  }

  if (sponsor) {
    builder = builder.sponsor(sponsor);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
