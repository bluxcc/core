import { getState } from '../../store';
import { internalSwitchNetwork } from '../utils';

/**
 * Switches the active network and stops automatic network syncing with the
 * connected wallet (so the choice sticks until changed again).
 *
 * @param newNetwork - Passphrase of the network to switch to; must be listed in `config.networks`.
 * @throws If called before {@link createConfig} or if the network is not in `config.networks`.
 */
export const switchNetwork = (newNetwork: string) => {
  const store = getState();

  internalSwitchNetwork(newNetwork);

  store.setNetworkSyncDisabled(true);
};
