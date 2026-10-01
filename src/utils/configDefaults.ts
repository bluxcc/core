import { Networks } from '@stellar/stellar-sdk';

import type { IConfig } from '../types';

export interface IResolvedConfigDefaults {
  appName: string;
  networks: string[];
  defaultNetwork: string;
}

/** Resolves the public config fields that the runtime always needs. */
export const resolveConfigDefaults = (
  config: IConfig,
): IResolvedConfigDefaults => {
  const defaultNetwork = config.defaultNetwork || undefined;
  const networks = config.networks?.length
    ? [...config.networks]
    : defaultNetwork
      ? [defaultNetwork]
      : [Networks.PUBLIC];

  return {
    appName: config.appName?.trim() ? config.appName : 'App',
    networks,
    defaultNetwork: defaultNetwork ?? networks[0],
  };
};
