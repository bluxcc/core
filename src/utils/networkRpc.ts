import { ITransports } from '../types';
import {
  INetworkTransports,
  DEFAULT_NETWORKS_TRANSPORTS,
} from '../constants/networkDetails';

/**
 * Resolves Horizon and Soroban URLs for a passphrase, overlaying any custom
 * transports from config.
 */
export const getNetworkRpc = (
  network: string,
  transports: ITransports,
): INetworkTransports => {
  const known = DEFAULT_NETWORKS_TRANSPORTS[network];
  const transport = transports[network];

  if (!known && !transport) {
    throw new Error('BLUX: Custom network has no transports.');
  }

  const details: INetworkTransports = known
    ? { ...known }
    : {
        name: 'Custom Network',
        horizon: '',
        soroban: '',
      };

  if (transport?.horizon) {
    details.horizon = transport.horizon;
  }

  if (transport?.soroban) {
    details.soroban = transport.soroban;
  }

  return details;
};
