import {
  rpc,
  Horizon,
  Transaction,
  scValToNative,
} from '@stellar/stellar-sdk';

import { ITransports, ISubmittedTransaction } from '../types';
import { getNetworkRpc, timeout } from '../utils/helpers';

// Stellar has two kinds of transactions. Classic ones (payments, trustlines,
// offers, ...) finalize the moment Horizon accepts them. Soroban ones (contract
// calls) are submitted to the RPC, take a few ledgers to finalize, and can carry
// a value returned by the invoked function. We detect the kind from the
// operations and route each to the right submitter.
const SOROBAN_OP_TYPES = [
  'invokeHostFunction',
  'extendFootprintTtl',
  'restoreFootprint',
];

// Poll the RPC for the finalized Soroban transaction at most this many times,
// spaced this far apart. ~30s is comfortably longer than the few ledgers a
// contract call takes to finalize.
const POLL_INTERVAL_MS = 1000;
const POLL_MAX_ATTEMPTS = 30;

const isSorobanTransaction = (transaction: Transaction): boolean =>
  transaction.operations.some((op) => SOROBAN_OP_TYPES.includes(op.type));

const submitClassic = async (
  transaction: Transaction,
  horizonUrl: string,
): Promise<ISubmittedTransaction> => {
  if (!horizonUrl) {
    throw new Error('BLUX: Horizon RPC was not found.');
  }

  const server = new Horizon.Server(horizonUrl);
  const response = await server.submitTransaction(transaction);

  return {
    hash: response.hash,
    raw: response,
    // Classic transactions never carry a contract return value.
    returnValue: async () => null,
  };
};

const submitSoroban = async (
  transaction: Transaction,
  sorobanUrl: string,
): Promise<ISubmittedTransaction> => {
  if (!sorobanUrl) {
    throw new Error('BLUX: Soroban RPC was not found.');
  }

  const server = new rpc.Server(sorobanUrl);

  const sent = await server.sendTransaction(transaction);

  if (sent.status === 'ERROR') {
    throw new Error(
      `BLUX: Failed to submit transaction: ${JSON.stringify(
        sent.errorResult ?? sent.status,
      )}`,
    );
  }

  if (sent.status === 'TRY_AGAIN_LATER') {
    throw new Error(
      'BLUX: The network is busy, please resubmit the transaction.',
    );
  }

  const { hash } = sent;

  // PENDING and DUPLICATE both mean the transaction made it into the system, so
  // poll getTransaction until it leaves the NOT_FOUND state.
  let result = await server.getTransaction(hash);
  let attempts = 0;

  while (result.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    if (attempts >= POLL_MAX_ATTEMPTS) {
      throw new Error(
        `BLUX: Timed out waiting for transaction ${hash} to finalize.`,
      );
    }

    await timeout(POLL_INTERVAL_MS);

    result = await server.getTransaction(hash);
    attempts += 1;
  }

  if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
    throw new Error(`BLUX: Transaction ${hash} failed on-chain.`);
  }

  // SUCCESS. `returnValue` is present when the invoked function returned a
  // value; it is absent for void functions, which resolve to null.
  const success = result;

  return {
    hash,
    raw: success,
    returnValue: async () =>
      success.returnValue ? scValToNative(success.returnValue) : null,
  };
};

async function submitTransaction(
  xdr: string,
  network: string,
  transports: ITransports,
): Promise<ISubmittedTransaction> {
  const { horizon, soroban } = getNetworkRpc(network, transports);

  const transaction = new Transaction(xdr, network);

  if (isSorobanTransaction(transaction)) {
    return submitSoroban(transaction, soroban);
  }

  return submitClassic(transaction, horizon);
}

export default submitTransaction;
