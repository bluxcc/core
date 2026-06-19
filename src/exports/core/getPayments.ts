import { callBuilder } from './callBuilder';
import { resolveAddressKey } from './helpers';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

/** Options for {@link getPayments}. Extends the shared {@link CallBuilderOptions}. */
export type GetPaymentsOptions = CallBuilderOptions & {
  /** Only payments touching this account (address or federated address). */
  forAccount?: string;
  /** Only payments in this ledger, by sequence number. */
  forLedger?: string | number;
  /** Only payments in this transaction, by hash. */
  forTransaction?: string;
  /** Include payments from failed transactions. Defaults to `false`. */
  includeFailed?: boolean;
};

/**
 * Lists payment operations, optionally scoped to an account, ledger, or
 * transaction.
 *
 * @param options - Filters, pagination, and network.
 * @returns The `builder` (for further paging) and the first-page `response`.
 */
export const getPayments = async (options: GetPaymentsOptions) => {
  checkConfigCreated();

  let builder = callBuilder('payments', [], options);

  const forAccount = await resolveAddressKey(options.forAccount);

  if (forAccount) {
    builder = builder.forAccount(forAccount);
  }

  if (options.forLedger) {
    builder = builder.forLedger(options.forLedger);
  }

  if (options.forTransaction) {
    builder = builder.forTransaction(options.forTransaction);
  }

  if (options.includeFailed != undefined) {
    builder = builder.includeFailed(options.includeFailed);
  }

  const response = await builder.call();

  return {
    builder,
    response,
  };
};
