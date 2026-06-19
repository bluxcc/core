import { Horizon } from '@stellar/stellar-sdk';
import { OperationCallBuilder } from '@stellar/stellar-sdk/lib/horizon/operation_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAddressKey } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getOperations}. Extends the shared {@link CallBuilderOptions}. */
export type GetOperationsOptions = CallBuilderOptions & {
  /** Only operations touching this account (address or federated address). */
  forAccount?: string;
  /** Only operations for this claimable balance id. */
  forClaimableBalance?: string;
  /** Only operations in this ledger, by sequence number. */
  forLedger?: string | number;
  /** Only operations in this transaction, by hash. */
  forTransaction?: string;
  /** Only operations for this liquidity pool id. */
  forLiquidityPool?: string;
  /** Include operations from failed transactions. Defaults to `false`. */
  includeFailed?: boolean;
};

/** The Horizon call builder plus the first page of operations. */
export type GetOperationsResult = {
  builder: OperationCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OperationRecord>;
};

/**
 * Lists operations, optionally scoped to an account, ledger, transaction,
 * claimable balance, or liquidity pool.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getOperations = async (
  options: GetOperationsOptions,
): Promise<GetOperationsResult> => {
  checkConfigCreated();

  let builder = callBuilder('operations', [], options);

  const forAccount = await resolveAddressKey(options.forAccount);

  if (forAccount) {
    builder = builder.forAccount(forAccount);
  }

  if (options.forClaimableBalance) {
    builder = builder.forClaimableBalance(options.forClaimableBalance);
  }

  if (options.forLedger) {
    builder = builder.forLedger(options.forLedger);
  }

  if (options.forTransaction) {
    builder = builder.forTransaction(options.forTransaction);
  }
  if (options.forLiquidityPool) {
    builder = builder.forLiquidityPool(options.forLiquidityPool);
  }

  if (options.includeFailed != undefined) {
    builder = builder.includeFailed(options.includeFailed);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
