import { Asset, Horizon } from "@stellar/stellar-sdk";
import { OrderbookCallBuilder } from "@stellar/stellar-sdk/lib/horizon/orderbook_call_builder";

import { callBuilder } from "./callBuilder";
import { checkConfigCreated, CallBuilderOptions } from "./utils";

interface GetOrderbookResult {
  builder: OrderbookCallBuilder;
  response: Horizon.ServerApi.OrderbookRecord;
}

const getOrderbook = async (
  args: [selling: Asset, buying: Asset],
  options: CallBuilderOptions,
): Promise<GetOrderbookResult> => {
  checkConfigCreated();

  let builder = callBuilder("orderbook", args, options);

  const response = await builder.call();

  return {
    builder,
    response,
  };
};

export default getOrderbook;
