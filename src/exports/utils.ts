import { Horizon, rpc, xdr } from '@stellar/stellar-sdk';

import { getState } from '../store';
import { BluxEvent } from '../utils/events';
import { getNetworkRpc } from '../utils/helpers';

/**
 * A single Soroban contract invocation, consumed by {@link readContracts} and
 * {@link writeContract}.
 */
export type IContractCall = {
  /** Contract id (`C...`) to invoke. */
  address: string;
  /** Name of the contract function to call. */
  fn: string;
  /** Call arguments, encoded as Soroban values — build these with {@link ToScVal}. */
  args: xdr.ScVal[];
};

/** Options for {@link readContracts}. */
export type ReadContractsOptions = {
  /** Network passphrase to simulate against. Defaults to the active network. */
  network?: string;
};

/** Options for {@link writeContract}. */
export type WriteContractsOptions = {
  /** Network passphrase to submit on. Defaults to the active network. */
  network?: string;
};

/** Pagination and network options shared by every Horizon list query. */
export type CallBuilderOptions = {
  /** Paging token; pass the previous page's cursor to fetch the next page. */
  cursor?: string;
  /** Maximum number of records returned per page. */
  limit?: number;
  /** Network passphrase to query. Defaults to the active network. */
  network?: string;
  /** Sort direction by ledger sequence. Defaults to Horizon's `asc`. */
  order?: 'asc' | 'desc';
};

/**
 * Reports whether {@link createConfig} has run and the SDK is initialized.
 *
 * @returns `true` once the Stellar transports are configured.
 */
export const checkConfigCreated = () => {
  const { stellar } = getState();

  return !!stellar;
};

/**
 * Resolves which address to act on, defaulting to the logged-in account.
 *
 * @param address - An explicit address to use instead of the logged-in account.
 * @returns The chosen address.
 * @throws If no address is provided and no account is logged in.
 */
export const getAddress = (address?: string) => {
  const { user } = getState();

  if (!user && !address) {
    throw new Error('BLUX: Address not found');
  }

  if (address) {
    return address;
  }

  return user?.address as string;
};

/**
 * Resolves the Horizon server, Soroban RPC server, and passphrase for a network.
 *
 * @param network - Passphrase of the network to use. Defaults to the active network.
 * @returns The `horizon` server, `soroban` RPC server, and `networkPassphrase`.
 * @throws If no network is given and the SDK has no configured transports.
 */
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

    throw new Error('BLUX: Custom network has no transports.');
  }

  const { horizon, soroban } = getNetworkRpc(network, config.transports ?? {});

  return {
    networkPassphrase: network,
    soroban: new rpc.Server(soroban),
    horizon: new Horizon.Server(horizon),
  };
};

/**
 * Switches the active network in the store and emits a network-changed event.
 * Internal plumbing for the exported {@link switchNetwork}.
 *
 * @param newNetwork - Passphrase of the network to switch to; must be listed in `config.networks`.
 * @throws If called before {@link createConfig}, if the network is not configured, or if there is no active network.
 */
export const internalSwitchNetwork = (newNetwork: string) => {
  const store = getState();
  const previousNetwork = store.stellar?.activeNetwork || '';

  if (store.config.networks.length === 0) {
    throw new Error('BLUX: switchNetwork must be called after createConfig');
  }

  if (!store.config.networks.includes(newNetwork)) {
    throw new Error('BLUX: New network must be defined in config.networks');
  }

  if (!store.stellar) {
    throw new Error('BLUX: Could not find the current activeNetwork');
  }

  store.setStellar({
    activeNetwork: newNetwork,
    servers: store.stellar?.servers,
  });

  if (previousNetwork && previousNetwork !== newNetwork) {
    getState().emitter.emit(BluxEvent.NetworkChanged, {
      previousNetwork,
      network: newNetwork,
    });
  }
};
