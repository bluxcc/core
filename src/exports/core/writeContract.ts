import {
  rpc,
  Contract,
  BASE_FEE,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  getNetwork,
  getAddress,
  IContractCall,
  checkConfigCreated,
  WriteContractsOptions,
} from '../utils';
import { sendTransaction } from '../blux';
import { ISubmittedTransaction } from '../../types';
import { contractArgsToScVals } from './contractArgs';
import { resolveAddress } from './helpers';

/**
 * Invokes a state-changing Soroban contract function: builds the call, simulates
 * it to attach resource fees / footprint / auth, then signs and submits it with
 * the logged-in account. Requires a logged-in user.
 *
 * Native `args` are encoded from the deployed contract's spec. Positional
 * values such as `args: ['G...', 1234]` therefore become an address and,
 * for example, an i128 when those are the function's declared parameter types.
 * `.xlm` names are resolved only for ABI-declared address values; a `.xlm`
 * value declared as a string or any other non-address type is sent unchanged.
 * Pre-encoded {@link xdr.ScVal} arguments remain supported.
 *
 * @param call - The contract call to make.
 * @param options - Network to submit on.
 * @returns The submitted transaction, whose `returnValue()` resolves to the contract's decoded return value.
 * @throws If called before {@link createConfig}, if `call.address`/`call.fn` are missing, or if simulation fails.
 */
export const writeContract = async <TReturnValue = unknown>(
  call: IContractCall,
  options: WriteContractsOptions = {},
): Promise<ISubmittedTransaction<TReturnValue>> => {
  if (!checkConfigCreated()) {
    throw new Error('BLUX: writeContract must be called after createConfig');
  }

  if (!call || !call.address) {
    throw new Error('BLUX: call.address is required');
  }

  if (!call.fn || call.fn.trim() === '') {
    throw new Error('BLUX: call.fn is required');
  }

  const { soroban, networkPassphrase } = getNetwork(options.network);

  const sourceAddress = getAddress();
  const [{ contractId }, sourceAccount] = await Promise.all([
    resolveAddress(call.address, { expected: 'contract' }),
    soroban.getAccount(sourceAddress),
  ]);
  const contract = new Contract(contractId);
  const args = await contractArgsToScVals(
    contractId,
    call.fn,
    call.args || [],
    soroban,
    networkPassphrase,
    'call',
  );

  const transaction = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(call.fn, ...args))
    .setTimeout(180)
    .build();

  const simulation = await soroban.simulateTransaction(transaction);

  if (rpc.Api.isSimulationError(simulation)) {
    throw new Error(
      `BLUX: Contract call failed (${contractId}.${call.fn}): ${simulation.error}`,
    );
  }

  const assembled = rpc.assembleTransaction(transaction, simulation).build();

  return sendTransaction(assembled.toXDR(), {
    network: networkPassphrase,
  }) as Promise<ISubmittedTransaction<TReturnValue>>;
};
