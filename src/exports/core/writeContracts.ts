import {
  getNetwork,
  IContractCall,
  checkConfigCreated,
  CallContractsOptions,
} from '../utils';

// u8, u16, u24, u32, u40, u48, u56, u64, u72, u80, u88, u96, u104, u112, u120, u128
// i8, i16, i24, i32, i40, i48, i56, i64, i72, i80, i88, i96, i104, i112, i120, i128
// Address
// Bytes
// Enum?
// Object?

export type Val = [any, string];

export const writeContracts = async (
  calls: IContractCall[],
  options: CallContractsOptions,
) => {
  checkConfigCreated();

  const { soroban } = getNetwork(options.network);

  const result = await Promise.all(
    calls.map((call) => soroban.getTransaction(call)),
  );

  return result;
};
