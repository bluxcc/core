import { Horizon } from '@stellar/stellar-sdk';
import { OfferCallBuilder } from '@stellar/stellar-sdk/lib/horizon/offer_call_builder';

import { callBuilder } from './callBuilder';
import { resolveAsset, resolveAddressKey, type AssetArg } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getOffers}. Extends the shared {@link CallBuilderOptions}. */
export type GetOffersOptions = CallBuilderOptions & {
  /** Only offers owned by this account (address or federated address). */
  forAccount?: string;
  /** Only offers buying this asset (`'xlm'`, `'CODE:ISSUER'`, or an `Asset`). */
  buying?: AssetArg;
  /** Only offers selling this asset (`'xlm'`, `'CODE:ISSUER'`, or an `Asset`). */
  selling?: AssetArg;
  /** Only offers sponsored by this account id. */
  sponsor?: string;
  /** Only offers created by this seller (address or federated address). */
  seller?: string;
};

/** The Horizon call builder plus the first page of offers. */
export type GetOffersResult = {
  builder: OfferCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.OfferRecord>;
};

/**
 * Lists open DEX offers, optionally scoped by owner, buying/selling asset,
 * sponsor, or seller.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getOffers = async (
  options: GetOffersOptions,
): Promise<GetOffersResult> => {
  checkConfigCreated();

  let builder = callBuilder('offers', [], options);

  const [forAccount, sponsor, seller] = await Promise.all([
    resolveAddressKey(options.forAccount),
    resolveAddressKey(options.sponsor),
    resolveAddressKey(options.seller),
  ]);

  if (forAccount) {
    builder = builder.forAccount(forAccount);
  }

  if (options.buying) {
    builder = builder.buying(resolveAsset(options.buying));
  }

  if (options.selling) {
    builder = builder.selling(resolveAsset(options.selling));
  }

  if (sponsor) {
    builder = builder.sponsor(sponsor);
  }

  if (seller) {
    builder = builder.seller(seller);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
