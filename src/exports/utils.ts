import { Horizon, rpc } from '@stellar/stellar-sdk';

import { getState } from '../store';
import { getNetworkRpc } from '../utils/helpers';

export type Val = [any, string];

export type IContractCall = {
  address: string;
  fn: string;
  args: Val[];
};

export type CallContractsOptions = {
  network?: string;
};

export type CallBuilderOptions = {
  cursor?: string;
  limit?: number;
  network?: string;
  order?: 'asc' | 'desc';
};

export const checkConfigCreated = () => {
  const { stellar } = getState();

  return !!stellar;
};

export const getAddress = (address?: string) => {
  const { user } = getState();

  if (!user && !address) {
    throw new Error('Address not found');
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

    throw new Error('Custom network has no transports.');
  }

  const { horizon, soroban } = getNetworkRpc(network, config.transports ?? {});

  return {
    networkPassphrase: network,
    soroban: new rpc.Server(soroban),
    horizon: new Horizon.Server(horizon),
  };
};

export const internalSwitchNetwork = (newNetwork: string) => {
  const store = getState();

  if (store.config.networks.length === 0) {
    throw new Error('switchNetwork must be called after createConfig');
  }

  if (!store.config.networks.includes(newNetwork)) {
    throw new Error('New network must be defined in config.networks');
  }

  if (!store.stellar) {
    throw new Error('Could not find the current activeNetwork');
  }

  store.setStellar({
    activeNetwork: newNetwork,
    servers: store.stellar?.servers,
  });
};
