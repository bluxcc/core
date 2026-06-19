import { getState } from '../../store';

/**
 * Returns the passphrase of the currently active network.
 *
 * @returns The active network passphrase, or an empty string if none is set.
 * @throws If called before {@link createConfig}.
 */
export const getNetwork = () => {
  const store = getState();

  if (store.config.networks.length === 0) {
    throw new Error('BLUX: getNetwork must be called after createConfig');
  }

  return store.stellar?.activeNetwork || '';
};
