import { Horizon } from "@stellar/stellar-sdk";
import { OperationCallBuilder } from "@stellar/stellar-sdk/lib/horizon/operation_call_builder";

import { callBuilder } from "./callBuilder";
import { checkConfigCreated, CallBuilderOptions } from "./utils";

interface GetOperationsOptions extends CallBuilderOptions {
  forAccount?: string;
  forClaimableBalance?: string;
  forLedger?: string | number;
  forTransaction?: string;
  forLiquidityPool?: string;
  includeFailed?: boolean;
}

interface GetOperationsResult {
  builder: OperationCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OperationRecord>;
}

const getOperations = async (
  options: GetOperationsOptions,
): Promise<GetOperationsResult> => {
  checkConfigCreated();

  let builder = callBuilder("operations", [], options);

  if (options.forAccount) {
    builder = builder.forAccount(options.forAccount);
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

export default getOperations;
