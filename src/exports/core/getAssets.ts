import { Horizon } from '@stellar/stellar-sdk';
import { AssetsCallBuilder } from '@stellar/stellar-sdk/lib/horizon/assets_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetAssetsOptions = CallBuilderOptions & {
  forCode?: string;
  forIssuer?: string;
};

export type GetAssetsResult = {
  builder: AssetsCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.AssetRecord>;
};

export const getAssets = async (
  options: GetAssetsOptions,
): Promise<GetAssetsResult> => {
  checkConfigCreated();

  let builder = callBuilder('assets', [], options);

  if (options.forCode) {
    builder = builder.forCode(options.forCode);
  }

  if (options.forIssuer) {
    builder = builder.forIssuer(options.forIssuer);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
