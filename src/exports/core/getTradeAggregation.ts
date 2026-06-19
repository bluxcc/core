import { callBuilder } from './callBuilder';
import { resolveAsset, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** The Horizon call builder plus the first page of trade-aggregation buckets. */
export type GetTradeAggregationResult = any;

/**
 * Fetches time-bucketed trade aggregations (OHLC-style price/volume data) for an
 * asset pair.
 *
 * @param args - `[base, counter, start_time, end_time, resolution, offset]`.
 *   `base`/`counter` accept `'xlm'`, `'CODE:ISSUER'`, or an `Asset`; times are in
 *   epoch milliseconds; `resolution` is the bucket size in milliseconds.
 * @param options - Pagination and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getTradeAggregation = async (
  args: [
    base: AssetArg,
    counter: AssetArg,
    start_time: number,
    end_time: number,
    resolution: number,
    offset: number,
  ],
  options: CallBuilderOptions,
): Promise<GetTradeAggregationResult> => {
  checkConfigCreated();

  const [base, counter, start_time, end_time, resolution, offset] = args;

  let builder = callBuilder(
    'tradeAggregation',
    [
      resolveAsset(base),
      resolveAsset(counter),
      start_time,
      end_time,
      resolution,
      offset,
    ],
    options,
  );

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
