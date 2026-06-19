import { getState } from '../../store';
import { resolveAsset, type AssetArg } from './helpers';

/**
 * Computes the Stellar Asset Contract (SAC) address of a classic asset.
 *
 * Every classic asset — native XLM or a `CODE:ISSUER` pair — has a deterministic
 * Soroban contract id derived from the asset plus the network passphrase. That
 * contract (the SAC) is what lets Soroban contracts hold and move the asset. The
 * id is computed locally with no network call, so it is returned whether or not
 * the SAC has actually been deployed yet. Feed the result into
 * {@link getTokenMetadata}, {@link transfer}'s `token` option, or
 * {@link readContracts} / {@link writeContract}.
 *
 * @param asset - The asset: `'xlm'` / `'native'`, a `CODE:ISSUER` string, or an `Asset`.
 * @param network - Network passphrase to derive against. Defaults to the active network.
 * @returns The SAC contract id (`C...`).
 * @throws If the asset is invalid, or no network is given and there is no active network.
 */
export const getSacAddress = (asset: AssetArg, network?: string): string => {
  const resolvedAsset = resolveAsset(asset);

  const passphrase = network ?? getState().stellar?.activeNetwork;

  if (!passphrase) {
    throw new Error(
      'BLUX: getSacAddress needs a network passphrase — pass one, or call createConfig first.',
    );
  }

  return resolvedAsset.contractId(passphrase);
};
