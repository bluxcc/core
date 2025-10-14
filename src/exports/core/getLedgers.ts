import { Horizon } from '@stellar/stellar-sdk';
import { LedgerCallBuilder } from '@stellar/stellar-sdk/lib/horizon/ledger_call_builder';

import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetLedgersOptions = CallBuilderOptions & {
  ledger?: number | string;
};

export type GetLedgersResult = {
  builder: LedgerCallBuilder;
  response: Horizon.ServerApi.CollectionPage<Horizon.ServerApi.LedgerRecord>;
};

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
