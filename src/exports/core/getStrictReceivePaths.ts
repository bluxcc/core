import { Horizon } from '@stellar/stellar-sdk';
import { PathCallBuilder } from '@stellar/stellar-sdk/lib/esm/horizon/path_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, resolveAddress, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** The Horizon call builder plus the first page of payment paths. */
export type GetPaymentPathResult = {
  builder: PathCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.PaymentPathRecord>;
};

/**
 * Finds payment paths for a fixed amount received (strict-receive): "the
 * destination must receive exactly X — what could the source send?".
 *
 * @param args - `[source, destinationAsset, destinationAmount]`. `source` is
 *   either the paying account (address or federated address) or an array of
 *   candidate source assets; `destinationAsset` accepts `'xlm'`/`'CODE:ISSUER'`/`Asset`.
 * @param options - Pagination and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getStrictReceivePaths = async (
  args: [
    source: string | AssetArg[],
    destinationAsset: AssetArg,
    destinationAmount: string,
  ],
  options: CallBuilderOptions,
): Promise<GetPaymentPathResult> => {
  checkConfigCreated();

  const [source, destinationAsset, destinationAmount] = args;

  const resolvedSource =
    typeof source === 'string'
      ? (await resolveAddress(source)).publicKey
      : source.map((asset) => resolveAsset(asset));

  let builder = callBuilder(
    'strictReceivePaths',
    [resolvedSource, resolveAsset(destinationAsset), destinationAmount],
    options,
  );

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
