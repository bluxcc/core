import { Horizon } from '@stellar/stellar-sdk';
import { TransactionCallBuilder } from '@stellar/stellar-sdk/lib/esm/horizon/transaction_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAddressKey } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getTransactions}. Extends the shared {@link CallBuilderOptions}. */
export type GetTransactionsOptions = CallBuilderOptions & {
  /** Only transactions touching this account (address or federated address). */
  forAccount?: string;
  /** Only transactions affecting this claimable balance id. */
  forClaimableBalance?: string;
  /** Only transactions in this ledger, by sequence number. */
  forLedger?: string | number;
  /** Only transactions affecting this liquidity pool id. */
  forLiquidityPool?: string;
  /** Include failed transactions. Defaults to `false`. */
  includeFailed?: boolean;
};

/** The Horizon call builder plus the first page of transactions. */
export type GetTransactionsResult = {
  builder: TransactionCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.TransactionRecord>;
};

/**
 * Lists transactions, optionally scoped to an account, ledger, claimable
 * balance, or liquidity pool.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getTransactions = async (
  options: GetTransactionsOptions,
): Promise<GetTransactionsResult> => {
  checkConfigCreated();

  let builder = callBuilder('transactions', [], options);

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
