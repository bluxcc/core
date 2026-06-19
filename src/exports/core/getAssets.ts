import { Horizon } from '@stellar/stellar-sdk';
import { AssetsCallBuilder } from '@stellar/stellar-sdk/lib/horizon/assets_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getAssets}. Extends the shared {@link CallBuilderOptions}. */
export type GetAssetsOptions = CallBuilderOptions & {
  /** Filter to a single asset code (e.g. `USDC`). */
  forCode?: string;
  /** Filter to assets issued by this account id. */
  forIssuer?: string;
};

/** The Horizon call builder plus the first page of matching issued assets. */
export type GetAssetsResult = {
  builder: AssetsCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.AssetRecord>;
};

/**
 * Lists issued assets known to Horizon, optionally filtered by code and/or issuer.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
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
