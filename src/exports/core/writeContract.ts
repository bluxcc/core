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

/**
 * Invokes a state-changing Soroban contract function: builds the call, simulates
 * it to attach resource fees / footprint / auth, then signs and submits it with
 * the logged-in account. Requires a logged-in user.
 *
 * @param call - The contract call to make; build `args` with {@link ToScVal}.
 * @param options - Network to submit on.
 * @returns The submitted transaction, whose `returnValue()` resolves to the contract's decoded return value.
 * @throws If called before {@link createConfig}, if `call.address`/`call.fn` are missing, or if simulation fails.
 */
export const writeContract = async (
  call: IContractCall,
  options: WriteContractsOptions = {},
): Promise<ISubmittedTransaction> => {
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
  const sourceAccount = await soroban.getAccount(sourceAddress);

  const contract = new Contract(call.address);
  const args = call.args || [];

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
      `BLUX: Contract call failed (${call.address}.${call.fn}): ${simulation.error}`,
    );
  }

  const assembled = rpc.assembleTransaction(transaction, simulation).build();

  return sendTransaction(assembled.toXDR(), {
    network: networkPassphrase,
  }) as Promise<ISubmittedTransaction>;
};
