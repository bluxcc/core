import { Asset, Horizon } from '@stellar/stellar-sdk';
import { TradesCallBuilder } from '@stellar/stellar-sdk/lib/horizon/trades_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetTradesOptions = CallBuilderOptions & {
  forAssetPair?: [base: Asset, counter: Asset];
  forOffer?: string;
  forType?: Horizon.ServerApi.TradeType;
  forAccount?: string;
  forLiquidityPool?: string;
};

export type GetTradesResult = {
  builder: TradesCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.TradeRecord>;
};

export const getTrades = async (
  options: GetTradesOptions,
): Promise<GetTradesResult> => {
  checkConfigCreated();

  let builder = callBuilder('trades', [], options);

  if (options.forAssetPair) {
    builder = builder.forAssetPair(
      options.forAssetPair[0],
      options.forAssetPair[1],
    );
  }

  if (options.forOffer) {
    builder = builder.forOffer(options.forOffer);
  }

  if (options.forType) {
    builder = builder.forType(options.forType);
  }

  if (options.forAccount) {
    builder = builder.forAccount(options.forAccount);
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
