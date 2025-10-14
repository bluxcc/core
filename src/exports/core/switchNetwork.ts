import { getState } from '../../store';

export const switchNetwork = (newNetwork: string) => {
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
