import { Horizon } from '@stellar/stellar-sdk';
import { TradesCallBuilder } from '@stellar/stellar-sdk/lib/esm/horizon/trades_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, resolveAddressKey, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getTrades}. Extends the shared {@link CallBuilderOptions}. */
export type GetTradesOptions = CallBuilderOptions & {
  /** Only trades for this `[base, counter]` asset pair. Each accepts `'xlm'`, `'CODE:ISSUER'`, or an `Asset`. */
  forAssetPair?: [base: AssetArg, counter: AssetArg];
  /** Only trades against this offer id. */
  forOffer?: string;
  /** Only trades of this type (e.g. `orderbook`, `liquidity_pool`). */
  forType?: Horizon.ServerApi.TradeType;
  /** Only trades involving this account (address or federated address). */
  forAccount?: string;
  /** Only trades for this liquidity pool id. */
  forLiquidityPool?: string;
};

/** The Horizon call builder plus the first page of trades. */
export type GetTradesResult = {
  builder: TradesCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.TradeRecord>;
};

/**
 * Lists trades, optionally scoped to an asset pair, offer, type, account, or
 * liquidity pool.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getTrades = async (
  options: GetTradesOptions,
): Promise<GetTradesResult> => {
  checkConfigCreated();

  let builder = callBuilder('trades', [], options);

  if (options.forAssetPair) {
    builder = builder.forAssetPair(
      resolveAsset(options.forAssetPair[0]),
      resolveAsset(options.forAssetPair[1]),
    );
  }

  if (options.forOffer) {
    builder = builder.forOffer(options.forOffer);
  }

  if (options.forType) {
    builder = builder.forType(options.forType);
  }

  const forAccount = await resolveAddressKey(options.forAccount);

  if (forAccount) {
    builder = builder.forAccount(forAccount);
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
