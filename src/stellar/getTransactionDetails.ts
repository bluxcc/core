import { Transaction } from '@stellar/stellar-sdk';

const PATH_PAYMENT_TYPES = new Set([
  'pathPaymentStrictSend',
  'pathPaymentStrictReceive',
]);

const DESTINATION_OP_TYPES = new Set([
  'payment',
  'pathPaymentStrictSend',
  'pathPaymentStrictReceive',
  'createAccount',
  'createClaimableBalance',
]);

const opDestination = (op: Transaction['operations'][number]): string => {
  if ('destination' in op && typeof op.destination === 'string') {
    return op.destination;
  }

  return '';
};

const getTransactionDetails = (xdr: string, network: string) => {
  try {
    const transaction = new Transaction(xdr, network);
    const ops = transaction.operations;

    // A self-swap into a never-held asset prepends changeTrust; surface the
    // path payment as the action the user is actually confirming.
    const primary =
      ops.find((op) => PATH_PAYMENT_TYPES.has(op.type)) ||
      ops.find((op) => DESTINATION_OP_TYPES.has(op.type)) ||
      ops[0];

    if (!primary) {
      return null;
    }

    return {
      action: primary.type,
      operations: ops.length,
      sender: transaction.source,
      receiver: opDestination(primary),
      estimatedFee: Number(transaction.fee) / 1e7,
    };
  } catch (_error: any) {
    return null;
  }
};

export default getTransactionDetails;
