import { Horizon } from '@stellar/stellar-sdk';
import { EffectCallBuilder } from '@stellar/stellar-sdk/lib/esm/horizon/effect_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAddressKey } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getEffects}. Extends the shared {@link CallBuilderOptions}. */
export type GetEffectsOptions = CallBuilderOptions & {
  /** Only effects touching this account (address or federated address). */
  forAccount?: string;
  /** Only effects in this ledger, by sequence number. */
  forLedger?: string | number;
  /** Only effects in this transaction, by hash. */
  forTransaction?: string;
  /** Only effects produced by this operation id. */
  forOperation?: string;
  /** Only effects for this liquidity pool id. */
  forLiquidityPool?: string;
};

/** The Horizon call builder plus the first page of effects. */
export type GetEffectsResult = {
  builder: EffectCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.EffectRecord>;
};

/**
 * Lists effects (the granular ledger changes operations produce), optionally
 * scoped to an account, ledger, transaction, operation, or liquidity pool.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getEffects = async (
  options: GetEffectsOptions,
): Promise<GetEffectsResult> => {
  checkConfigCreated();

  let builder = callBuilder('effects', [], options);

  const forAccount = await resolveAddressKey(options.forAccount);

  if (forAccount) {
    builder = builder.forAccount(forAccount);
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
