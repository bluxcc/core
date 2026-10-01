import type { rpc } from '@stellar/stellar-sdk';

import {
  checkConfigCreated,
  type IContractCall,
  type ReadContractsOptions,
} from '../utils';
import { readContracts } from './readContracts';

/** Result of a single {@link readContract} call. */
export type ReadContractResult<TReturnValue = unknown> = {
  /** Full successful RPC simulation response. */
  raw: rpc.Api.SimulateTransactionSuccessResponse | undefined;
  /** Decoded native contract return value. */
  value: TReturnValue;
};

/**
 * Reads one Soroban contract function by simulation. This is the singular
 * counterpart to {@link readContracts}: it accepts one call and returns one
 * `raw` response and one decoded `value`, rather than arrays.
 *
 * Native arguments are encoded from the deployed contract's spec. `.xlm`
 * names are resolved only where the ABI declares an address; a `.xlm` value
 * declared as a string or another non-address type is sent unchanged.
 * Pre-encoded {@link xdr.ScVal} arguments remain supported.
 *
 * @param call - The contract call to simulate.
 * @param options - Network to simulate against.
 * @returns The full simulation response and decoded scalar return value.
 * @throws If called before {@link createConfig}, if `call.address`/`call.fn` are missing, or if simulation fails.
 */
export const readContract = async <TReturnValue = unknown>(
  call: IContractCall,
  options: ReadContractsOptions = {},
): Promise<ReadContractResult<TReturnValue>> => {
  if (!checkConfigCreated()) {
    throw new Error('BLUX: readContract must be called after createConfig');
  }

  if (!call || !call.address) {
    throw new Error('BLUX: call.address is required');
  }

  if (!call.fn || call.fn.trim() === '') {
    throw new Error('BLUX: call.fn is required');
  }

  const result = await readContracts<readonly [TReturnValue]>([call], options);

  return {
    raw: result.raws[0],
    value: result.values[0],
  };
};
