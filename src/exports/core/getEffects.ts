import { Horizon } from '@stellar/stellar-sdk';
import { EffectCallBuilder } from '@stellar/stellar-sdk/lib/horizon/effect_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetEffectsOptions = CallBuilderOptions & {
  forAccount?: string;
  forLedger?: string | number;
  forTransaction?: string;
  forOperation?: string;
  forLiquidityPool?: string;
};

export type GetEffectsResult = {
  builder: EffectCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.EffectRecord>;
};

export const getEffects = async (
  options: GetEffectsOptions,
): Promise<GetEffectsResult> => {
  checkConfigCreated();

  let builder = callBuilder('effects', [], options);

  if (options.forAccount) {
    builder = builder.forAccount(options.forAccount);
  }

  if (options.forLedger) {
    builder = builder.forLedger(options.forLedger);
  }

  if (options.forTransaction) {
    builder = builder.forTransaction(options.forTransaction);
  }

  if (options.forOperation) {
    builder = builder.forOperation(options.forOperation);
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
