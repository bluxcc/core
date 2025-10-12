import { Horizon } from '@stellar/stellar-sdk';
import { TransactionCallBuilder } from '@stellar/stellar-sdk/lib/horizon/transaction_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetTransactionsOptions = CallBuilderOptions & {
  forAccount?: string;
  forClaimableBalance?: string;
  forLedger?: string | number;
  forLiquidityPool?: string;
  includeFailed?: boolean;
};

export type GetTransactionsResult = {
  builder: TransactionCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.TransactionRecord>;
};

const getTransactions = async (
  options: GetTransactionsOptions,
): Promise<GetTransactionsResult> => {
  checkConfigCreated();

  let builder = callBuilder('transactions', [], options);

  if (options.forAccount) {
    builder = builder.forAccount(options.forAccount);
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

export default getTransactions;
