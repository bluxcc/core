import { Asset, Horizon } from '@stellar/stellar-sdk';
import { OfferCallBuilder } from '@stellar/stellar-sdk/lib/horizon/offer_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetOffersOptions = CallBuilderOptions & {
  forAccount?: string;
  buying?: Asset;
  selling?: Asset;
  sponsor?: string;
  seller?: string;
};

export type GetOffersResult = {
  builder: OfferCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OfferRecord>;
};

const getOffers = async (
  options: GetOffersOptions,
): Promise<GetOffersResult> => {
  checkConfigCreated();

  let builder = callBuilder('offers', [], options);

  if (options.forAccount) {
    builder = builder.forAccount(options.forAccount);
  }

  if (options.buying) {
    builder = builder.buying(options.buying);
  }

  if (options.selling) {
    builder = builder.selling(options.selling);
  }

  if (options.sponsor) {
    builder = builder.sponsor(options.sponsor);
  }

  if (options.seller) {
    builder = builder.seller(options.seller);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};

export default getOffers;
