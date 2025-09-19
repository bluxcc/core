import { Horizon, rpc } from "@stellar/stellar-sdk";

import { getState } from "../store";
import { getNetworkRpc } from "../utils/helpers";

export type CallBuilderOptions = {
  cursor?: string;
  limit?: number;
  network?: string;
  order?: "asc" | "desc";
};

export const checkConfigCreated = () => {
  const { stellar } = getState();

  return !!stellar;
};

export const getAddress = (address?: string) => {
  const { user } = getState();

  if (!user && !address) {
    throw new Error("Address not found");
  }

  if (address) {
    return address;
  }

  return user?.address as string;
};

export const getNetwork = (network?: string) => {
  const { stellar, config } = getState();

  if (!network) {
    if (stellar) {
      return {
        horizon: stellar.servers.horizon,
        soroban: stellar.servers.soroban,
        networkPassphrase: stellar.activeNetwork,
      };
    }

    throw new Error("Custom network has no transports.");
  }

  const { horizon, soroban } = getNetworkRpc(network, config.transports ?? {});

  return {
    networkPassphrase: network,
    soroban: new rpc.Server(soroban),
    horizon: new Horizon.Server(horizon),
  };
};
