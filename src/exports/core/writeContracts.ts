// import {
//   rpc,
//   Contract,
//   BASE_FEE,
//   TimeoutInfinite,
//   TransactionBuilder,
// } from '@stellar/stellar-sdk';
// import {
//   getNetwork,
//   IContractCall,
//   checkConfigCreated,
//   WriteContractsOptions,
// } from '../utils';
//
// const NULL_ACCOUNT = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
//
// // todo: optoin for finalization
// // todo: check if it is possible to write multiple times in a single transaction
// // todo: add caller here.
// export const writeContracts = async (
//   calls: IContractCall[],
//   options: WriteContractsOptions = {},
// ) => {
//   if (!checkConfigCreated()) {
//     throw new Error('BLUX: writeContracts must be called after createConfig');
//   }
//
//   if (!Array.isArray(calls)) {
//     throw new Error('BLUX: calls must be an array of IContractWriteCall');
//   }
//
//   if (calls.length === 0) {
//     return [];
//   }
//
//   const { soroban, networkPassphrase } = getNetwork(options.network);
//
//   // todo: getState().user.address OR signer in
//   // TODO: fix the TransactionBuilder ..
//   const txBuilder = new TransactionBuilder(NULL_ACCOUNT, {
//     fee: BASE_FEE,
//     networkPassphrase,
//   });
//
//   calls.forEach((call, callIndex) => {
//     if (!call || !call.address) {
//       throw new Error(`BLUX: calls[${callIndex}].address is required`);
//     }
//     if (!call.fn || call.fn.trim() === '') {
//       throw new Error(`BLUX: calls[${callIndex}].fn is required`);
//     }
//
//     const contract = new Contract(call.address);
//     const args = call.args || [];
//
//     txBuilder.addOperation(contract.call(call.fn, ...args));
//   });
//
//   txBuilder.setTimeout(TimeoutInfinite);
//   const transaction = txBuilder.build();
//
//   try {
//     const simulation = await soroban.simulateTransaction(transaction);
//
//     if (rpc.Api.isSimulationError(simulation)) {
//       throw new Error(
//         `Contract call simulation failed at calls[${calls.findIndex((c) => simulation.error.includes(c.fn))}].${calls.find((c) => simulation.error.includes(c.fn))?.fn}: ${simulation.error}`,
//       );
//     }
//   } catch (error: any) {
//     throw new Error(`BLUX: Failed to simulate transaction: ${error.message}`);
//   }
//
//   try {
//     const result = await soroban.sendTransaction(transaction);
//
//     return result;
//   } catch (error: any) {
//     throw new Error(`BLUX: Failed to send transaction: ${error.message}`);
//   }
// };
