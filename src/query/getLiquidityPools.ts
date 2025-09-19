import { Asset, Horizon } from "@stellar/stellar-sdk";
import { LiquidityPoolCallBuilder } from "@stellar/stellar-sdk/lib/horizon/liquidity_pool_call_builder";

import { callBuilder } from "./callBuilder";
import { checkConfigCreated, CallBuilderOptions } from "./utils";

type GetLiquidityPoolsOptions = CallBuilderOptions & {
  forAssets?: Array<Asset>;
  forAccount?: string;
};

type GetLiquidityPoolsResult = {
  builder: LiquidityPoolCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.LiquidityPoolRecord>;
};

const getLiquidityPools = async (
  options: GetLiquidityPoolsOptions,
): Promise<GetLiquidityPoolsResult> => {
  checkConfigCreated();

  let builder = callBuilder("liquidityPools", [], options);

  if (options.forAccount) {
    builder = builder.forAccount(options.forAccount);
  }

  if (options.forAssets) {
    builder = builder.forAssets(...options.forAssets);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};

export default getLiquidityPools;
