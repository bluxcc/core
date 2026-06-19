import { Horizon } from '@stellar/stellar-sdk';
import { LedgerCallBuilder } from '@stellar/stellar-sdk/lib/esm/horizon/ledger_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getLedgers}. Extends the shared {@link CallBuilderOptions}. */
export type GetLedgersOptions = CallBuilderOptions & {
  /** Fetch a single ledger by its sequence number. */
  ledger?: number | string;
};

/** The Horizon call builder plus the first page of ledgers. */
export type GetLedgersResult = {
  builder: LedgerCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.LedgerRecord>;
};

/**
 * Lists ledgers, or fetches a single ledger when `ledger` is given.
 *
 * @param options - Optional ledger selector, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getLedgers = async (
  options: GetLedgersOptions,
): Promise<GetLedgersResult> => {
  checkConfigCreated();

  let builder = callBuilder('ledgers', [], options);

  if (options.ledger) {
    builder = builder.ledger(options.ledger);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
