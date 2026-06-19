import { Horizon } from '@stellar/stellar-sdk';
import { LiquidityPoolCallBuilder } from '@stellar/stellar-sdk/lib/esm/horizon/liquidity_pool_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, resolveAddressKey, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getLiquidityPools}. Extends the shared {@link CallBuilderOptions}. */
export type GetLiquidityPoolsOptions = CallBuilderOptions & {
  /** Only pools made up of exactly these reserve assets (`'xlm'`, `'CODE:ISSUER'`, or `Asset`). */
  forAssets?: Array<AssetArg>;
  /** Only pools this account holds shares in (address or federated address). */
  forAccount?: string;
};

/** The Horizon call builder plus the first page of liquidity pools. */
export type GetLiquidityPoolsResult = {
  builder: LiquidityPoolCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.LiquidityPoolRecord>;
};

/**
 * Lists liquidity pools, optionally scoped to a set of reserve assets or a
 * participating account.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getLiquidityPools = async (
  options: GetLiquidityPoolsOptions,
): Promise<GetLiquidityPoolsResult> => {
  checkConfigCreated();

  let builder = callBuilder('liquidityPools', [], options);

  const forAccount = await resolveAddressKey(options.forAccount);

  if (forAccount) {
    builder = builder.forAccount(forAccount);
  }

  if (options.forAssets) {
    builder = builder.forAssets(
      ...options.forAssets.map((a) => resolveAsset(a)),
    );
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
