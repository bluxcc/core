// import {
//   Account,
//   BASE_FEE,
//   Contract,
//   TimeoutInfinite,
//   TransactionBuilder,
//   nativeToScVal,
//   rpc,
//   scValToNative,
//   xdr,
// } from '@stellar/stellar-sdk';
//
// import {
//   getNetwork,
//   IContractCall,
//   Val,
//   checkConfigCreated,
//   CallContractsOptions,
// } from '../utils';
//
// const NULL_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
//
// const isScVal = (value: unknown): value is xdr.ScVal =>
//   value instanceof xdr.ScVal;
//
// const isArgObject = (
//   arg: unknown,
// ): arg is {
//   value: unknown;
//   type?: any;
// } => {
//   return !!arg && typeof arg === 'object' && 'value' in (arg as object);
// };
//
// const normalizeIntType = (type: string): string => {
//   const match = type.match(/^([ui])(\d{1,3})$/);
//
//   if (!match) {
//     return type;
//   }
//
//   const sign = match[1];
//   const bits = Number(match[2]);
//
//   if (Number.isNaN(bits) || bits <= 0 || bits > 256) {
//     return type;
//   }
//
//   if (sign === 'u') {
//     if (bits <= 32) return 'u32';
//     if (bits <= 64) return 'u64';
//     if (bits <= 128) return 'u128';
//     return 'u256';
//   }
//
//   if (bits <= 32) return 'i32';
//   if (bits <= 64) return 'i64';
//   if (bits <= 128) return 'i128';
//   return 'i256';
// };
//
// const normalizeType = (type: any) => {
//   if (typeof type !== 'string') {
//     return type;
//   }
//
//   const normalized = type.trim().toLowerCase();
//
//   if (normalized === 'boolean') return 'bool';
//   if (normalized === 'byte') return 'bytes';
//   if (normalized === 'str') return 'string';
//   if (normalized === 'scval') return 'scval';
//
//   return normalizeIntType(normalized);
// };
//
// const normalizeBytes = (value: unknown): Uint8Array => {
//   if (value instanceof Uint8Array) {
//     return value;
//   }
//
//   if (Array.isArray(value)) {
//     return Uint8Array.from(value as number[]);
//   }
//
//   if (typeof value === 'string') {
//     const maybeHex = value.startsWith('0x') ? value.slice(2) : value;
//
//     if (/^[0-9a-fA-F]+$/.test(maybeHex) && maybeHex.length % 2 === 0) {
//       return Uint8Array.from(Buffer.from(maybeHex, 'hex'));
//     }
//
//     return Uint8Array.from(Buffer.from(value, 'utf8'));
//   }
//
//   throw new Error(
//     'Invalid bytes value. Use Uint8Array, number[], utf8 string, or 0x-prefixed hex string.',
//   );
// };
//
// const toScVal = (arg: Val | unknown): xdr.ScVal => {
//   if (isScVal(arg)) {
//     return arg;
//   }
//
//   let value: unknown;
//   let type: any;
//
//   if (Array.isArray(arg)) {
//     value = arg[0];
//     type = arg[1];
//   } else if (isArgObject(arg)) {
//     value = arg.value;
//     type = arg.type;
//   } else {
//     value = arg;
//   }
//
//   const normalizedType = normalizeType(type);
//
//   if (normalizedType === 'scval') {
//     if (!isScVal(value)) {
//       throw new Error('Type "scval" requires value to already be xdr.ScVal.');
//     }
//
//     return value;
//   }
//
//   if (normalizedType === 'bytes') {
//     return nativeToScVal(normalizeBytes(value), { type: 'bytes' });
//   }
//
//   if (normalizedType === 'bool' && typeof value === 'string') {
//     const bool = value.toLowerCase();
//
//     if (bool === 'true') {
//       return nativeToScVal(true);
//     }
//
//     if (bool === 'false') {
//       return nativeToScVal(false);
//     }
//   }
//
//   if (
//     normalizedType !== undefined &&
//     normalizedType !== null &&
//     normalizedType !== ''
//   ) {
//     return nativeToScVal(value, { type: normalizedType });
//   }
//
//   return nativeToScVal(value);
// };
//
// export type ReadContractsResult = unknown[];
//
// export const readContracts = async (
//   calls: IContractCall[],
//   options: CallContractsOptions = {},
// ): Promise<ReadContractsResult> => {
//   if (!checkConfigCreated()) {
//     throw new Error('readContracts must be called after createConfig');
//   }
//
//   if (!Array.isArray(calls)) {
//     throw new Error('calls must be an array of IContractCall');
//   }
//
//   if (calls.length === 0) {
//     return [];
//   }
//
//   const { soroban, networkPassphrase } = getNetwork(options.network);
//
//   const results = await Promise.all(
//     calls.map(async (call, callIndex) => {
//       if (!call || !call.address) {
//         throw new Error(`calls[${callIndex}].address is required`);
//       }
//
//       if (!call.fn || call.fn.trim() === '') {
//         throw new Error(`calls[${callIndex}].fn is required`);
//       }
//
//       const contract = new Contract(call.address);
//       const args = (call.args || []).map((arg, argIndex) => {
//         try {
//           return toScVal(arg);
//         } catch (error: any) {
//           throw new Error(
//             `Invalid argument at calls[${callIndex}].args[${argIndex}]: ${error.message || 'Unknown error'}`,
//           );
//         }
//       });
//
//       const transaction = new TransactionBuilder(
//         new Account(NULL_ACCOUNT, '0'),
//         {
//           fee: BASE_FEE,
//           networkPassphrase,
//         },
//       )
//         .addOperation(contract.call(call.fn, ...args))
//         .setTimeout(TimeoutInfinite)
//         .build();
//
//       const simulation = await soroban.simulateTransaction(transaction);
//
//       if (rpc.Api.isSimulationError(simulation)) {
//         throw new Error(
//           `Contract call failed at calls[${callIndex}] (${call.address}.${call.fn}): ${simulation.error}`,
//         );
//       }
//
//       if (!simulation.result) {
//         return null;
//       }
//
//       return scValToNative(simulation.result.retval);
//     }),
//   );
//
//   return results;
// };
