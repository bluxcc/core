import { getState } from '../../store';
import { internalSwitchNetwork } from '../utils';

export const switchNetwork = (newNetwork: string) => {
  const store = getState();

  internalSwitchNetwork(newNetwork);

  store.setNetworkSyncDisabled(true);
};
