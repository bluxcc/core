import { Asset, Horizon } from '@stellar/stellar-sdk';
import { PathCallBuilder } from '@stellar/stellar-sdk/lib/horizon/path_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetPaymentPathResult = {
  builder: PathCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.PaymentPathRecord>;
};

export const getStrictSendPaths = async (
  args: [
    sourceAsset: Asset,
    sourceAmount: string,
    destination: string | Asset[],
  ],
  options: CallBuilderOptions,
): Promise<GetPaymentPathResult> => {
  checkConfigCreated();

  let builder = callBuilder('strictSendPaths', args, options);

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
