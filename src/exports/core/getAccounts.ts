import { Asset, Horizon } from '@stellar/stellar-sdk';
import { AccountCallBuilder } from '@stellar/stellar-sdk/lib/horizon/account_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

type GetAccountsOptionsA = {
  forSigner: string;
  forAsset?: Asset;
  sponsor?: string;
  forLiquidityPool?: string;
};

type GetAccountsOptionsB = {
  forSigner?: string;
  forAsset: Asset;
  sponsor?: string;
  forLiquidityPool?: string;
};

type GetAccountsOptionsC ={
  forSigner?: string;
  forAsset?: Asset;
  sponsor: string;
  forLiquidityPool?: string;
};

type GetAccountsOptionsD = {
  forSigner?: string;
  forAsset?: Asset;
  sponsor?: string;
  forLiquidityPool: string;
};

export type GetAccountsOptions = CallBuilderOptions & (
  GetAccountsOptionsA | GetAccountsOptionsB | GetAccountsOptionsC | GetAccountsOptionsD
)

export type GetAccountsResult = {
  builder: AccountCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.AccountRecord>;
};

export const getAccounts = async (
  options: GetAccountsOptions,
): Promise<GetAccountsResult> => {
  checkConfigCreated();

  let builder = callBuilder('accounts', [], options);

  if (options.forSigner) {
    builder = builder.forSigner(options.forSigner);
  }

  if (options.forAsset) {
    builder = builder.forAsset(options.forAsset);
  }

  if (options.sponsor) {
    builder = builder.sponsor(options.sponsor);
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
