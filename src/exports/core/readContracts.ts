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

/**
 * Reads from one or more Soroban contracts by simulating the calls — no
 * transaction is submitted and no account is required, so this is free and
 * read-only. Each call's return value is decoded to a native JS value (`bigint`
 * results are stringified).
 *
 * @param calls - The contract calls to simulate; build `args` with {@link ToScVal}.
 * @param options - Network to simulate against.
 * @returns `{ raws, values }` aligned to `calls` — `raws` holds the full
 *   simulation per call, `values` the decoded return values (`null` for a call
 *   that returned nothing). An empty array is returned when `calls` is empty.
 * @throws If called before {@link createConfig}, if `calls` is not an array, or if any simulation fails.
 */
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

      let rawValue = scValToNative(simulation.result.retval);

      if (typeof rawValue === 'bigint') {
        rawValue = rawValue.toString();
      }

      return {
        raw: simulation,
        value: rawValue,
      };
    }),
  );

  const raws = results.map((x) => x?.raw);
  const values = results.map((x) => x?.value);

  return {
    raws,
    values,
  };
};
