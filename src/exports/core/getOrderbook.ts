import { Horizon } from '@stellar/stellar-sdk';
import { OrderbookCallBuilder } from '@stellar/stellar-sdk/lib/horizon/orderbook_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** The Horizon call builder plus the current order book snapshot. */
export type GetOrderbookResult = {
  builder: OrderbookCallBuilder;
  response: Horizon.ServerApi.OrderbookRecord;
};

/**
 * Fetches the DEX order book for a `selling`/`buying` asset pair.
 *
 * @param args - `[selling, buying]`; each accepts `'xlm'`, `'CODE:ISSUER'`, or an `Asset`.
 * @param options - Pagination and network.
 * @returns The `builder` and the order book `response`.
 */
export const getOrderbook = async (
  args: [selling: AssetArg, buying: AssetArg],
  options: CallBuilderOptions,
): Promise<GetOrderbookResult> => {
  checkConfigCreated();

  const [selling, buying] = args;

  let builder = callBuilder(
    'orderbook',
    [resolveAsset(selling), resolveAsset(buying)],
    options,
  );

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
