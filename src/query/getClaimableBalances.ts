import { Asset, Horizon } from "@stellar/stellar-sdk";
import { ClaimableBalanceCallBuilder } from "@stellar/stellar-sdk/lib/horizon/claimable_balances_call_builder";

import { callBuilder } from "./callBuilder";
import { checkConfigCreated, CallBuilderOptions } from "./utils";

interface GetClaimableBalancesOptions extends CallBuilderOptions {
  asset: Asset;
  sponsor?: string;
  claimant: string;
}

interface GetClaimableBalancesResult {
  builder: ClaimableBalanceCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.ClaimableBalanceRecord>;
}

const getClaimableBalances = async (
  options: GetClaimableBalancesOptions,
): Promise<GetClaimableBalancesResult> => {
  checkConfigCreated();

  let builder = callBuilder("claimableBalances", [], options);

  if (options.asset) {
    builder = builder.asset(options.asset);
  }

  if (options.claimant) {
    builder = builder.claimant(options.claimant);
  }

  if (options.sponsor) {
    builder = builder.sponsor(options.sponsor);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};

export default getClaimableBalances;
