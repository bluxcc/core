import {
  rpc,
  Account,
  Contract,
  BASE_FEE,
  scValToNative,
  TimeoutInfinite,
  TransactionBuilder,
} from '@stellar/stellar-sdk';
import {
  getNetwork,
  IContractCall,
  checkConfigCreated,
  ReadContractsOptions,
} from '../utils';

const NULL_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';

export const readContracts = async (
  calls: IContractCall[],
  options: ReadContractsOptions = {},
) => {
  if (!checkConfigCreated()) {
    throw new Error('BLUX: readContracts must be called after createConfig');
  }

  if (!Array.isArray(calls)) {
    throw new Error('BLUX: calls must be an array of IContractCall');
  }

  if (calls.length === 0) {
    return [];
  }

  const { soroban, networkPassphrase } = getNetwork(options.network);

  const results = await Promise.all(
    calls.map(async (call, callIndex) => {
      if (!call || !call.address) {
        throw new Error(`BLUX: calls[${callIndex}].address is required`);
      }

      if (!call.fn || call.fn.trim() === '') {
        throw new Error(`BLUX: calls[${callIndex}].fn is required`);
      }

      const contract = new Contract(call.address);

      const args = call.args || [];

      const transaction = new TransactionBuilder(
        new Account(NULL_ACCOUNT, '0'),
        {
          fee: BASE_FEE,
          networkPassphrase,
        },
      )
        .addOperation(contract.call(call.fn, ...args))
        .setTimeout(TimeoutInfinite)
        .build();

      const simulation = await soroban.simulateTransaction(transaction);

      if (rpc.Api.isSimulationError(simulation)) {
        throw new Error(
          `BLUX: Contract call failed at calls[${callIndex}] (${call.address}.${call.fn}): ${simulation.error}`,
        );
      }

      if (!simulation.result) {
        return null;
      }

      return scValToNative(simulation.result.retval);
    }),
  );

  return results;
};
