import { callBuilder } from './callBuilder';
import { checkConfigCreated, CallBuilderOptions } from '../utils';

export type GetPaymentsOptions = CallBuilderOptions & {
  forAccount?: string;
  forLedger?: string | number;
  forTransaction?: string;
  includeFailed?: boolean;
};

const getPayments = async (options: GetPaymentsOptions) => {
  checkConfigCreated();

  let builder = callBuilder('payments', [], options);

  if (options.forAccount) {
    builder = builder.forAccount(options.forAccount);
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

export default getPayments;
