import { Asset } from "@stellar/stellar-sdk";

import { callBuilder } from "./callBuilder";
import { checkConfigCreated, CallBuilderOptions } from "./utils";

const getTradeAggregation = async (
  args: [
    base: Asset,
    counter: Asset,
    start_time: number,
    end_time: number,
    resolution: number,
    offset: number,
  ],
  options: CallBuilderOptions,
) => {
  checkConfigCreated();

  let builder = callBuilder("tradeAggregation", args, options);

  const response = await builder.call();

  return {
    builder,
    response,
  };
};

export default getTradeAggregation;
