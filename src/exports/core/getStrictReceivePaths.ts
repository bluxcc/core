import { Asset, Horizon } from '@stellar/stellar-sdk';
import { PathCallBuilder } from '@stellar/stellar-sdk/lib/horizon/path_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetPaymentPathResult = {
  builder: PathCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.PaymentPathRecord>;
};

const getStrictReceivePaths = async (
  args: [
    source: string | Asset[],
    destinationAsset: Asset,
    destinationAmount: string,
  ],
  options: CallBuilderOptions,
): Promise<GetPaymentPathResult> => {
  checkConfigCreated();

  let builder = callBuilder('strictReceivePaths', args, options);

  const response = await builder.call();

  return {
    builder,
    response,
  };
};

export default getStrictReceivePaths;
