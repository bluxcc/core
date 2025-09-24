import { Horizon, Transaction } from "@stellar/stellar-sdk";

import { ITransports } from "../types";
import { getNetworkRpc } from "../utils/helpers";

async function submitTransaction(
  xdr: string,
  network: string,
  transports: ITransports,
): Promise<// | rpc.Api.GetSuccessfulTransactionResponse
Horizon.HorizonApi.SubmitTransactionResponse> {
  const { horizon } = getNetworkRpc(network, transports);

  if (!horizon) {
    throw new Error("Horizon RPC was not found.");
  }

  const server = new Horizon.Server(horizon);
  const transaction = new Transaction(xdr, network);

  // if (options.isSoroban) {
  // const sorobanServer = new rpc.Server(soroban.url);
  // const tx = await sorobanServer.sendTransaction(transaction);
  // const finalize = await finalizeSorobanTransaction(tx.hash, sorobanServer);
  //
  // return finalize as rpc.Api.GetSuccessfulTransactionResponse;
  // } else {
  const response = await server.submitTransaction(transaction);

  return response;
  // }
}

export default submitTransaction;
