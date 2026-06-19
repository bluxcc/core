import { Horizon } from '@stellar/stellar-sdk';
import { PathCallBuilder } from '@stellar/stellar-sdk/lib/horizon/path_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, resolveAddress, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** The Horizon call builder plus the first page of payment paths. */
export type GetPaymentPathResult = {
  builder: PathCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.PaymentPathRecord>;
};

/**
 * Finds payment paths for a fixed amount sent (strict-send): "I will send
 * exactly X of the source asset — what can the destination receive?".
 *
 * @param args - `[sourceAsset, sourceAmount, destination]`. `sourceAsset` accepts
 *   `'xlm'`/`'CODE:ISSUER'`/`Asset`; `destination` is either a recipient account
 *   (address or federated address) or an array of candidate destination assets.
 * @param options - Pagination and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getStrictSendPaths = async (
  args: [
    sourceAsset: AssetArg,
    sourceAmount: string,
    destination: string | AssetArg[],
  ],
  options: CallBuilderOptions,
): Promise<GetPaymentPathResult> => {
  checkConfigCreated();

  const [sourceAsset, sourceAmount, destination] = args;

  const resolvedDestination =
    typeof destination === 'string'
      ? (await resolveAddress(destination)).publicKey
      : destination.map((asset) => resolveAsset(asset));

  let builder = callBuilder(
    'strictSendPaths',
    [resolveAsset(sourceAsset), sourceAmount, resolvedDestination],
    options,
  );

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
