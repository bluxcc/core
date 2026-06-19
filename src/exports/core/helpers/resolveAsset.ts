import { Asset, StrKey } from '@stellar/stellar-sdk';

/**
 * Loose asset input accepted across the SDK and normalized by
 * {@link resolveAsset}:
 *
 * - `'xlm'` / `'native'` — the native lumen
 * - `'USDC:GA5Z...KZVN'` — an issued asset in `CODE:ISSUER` form
 * - an {@link Asset} instance — returned unchanged
 */
export type AssetArg = string | Asset;

/**
 * Normalizes an {@link AssetArg} into a stellar-sdk {@link Asset}. Shared by the
 * core functions so they all parse assets the same way.
 *
 * @param asset - `'xlm'`/`'native'`, a `CODE:ISSUER` string, or an `Asset`.
 * @returns The corresponding `Asset` (native for `'xlm'`/`'native'`).
 * @throws If the value is not a recognized form, or the issuer is not a valid Ed25519 public key.
 */
export const resolveAsset = (asset: AssetArg): Asset => {
  if (asset instanceof Asset) {
    return asset;
  }

  if (typeof asset !== 'string') {
    throw new Error(
      'BLUX: asset must be "xlm", "native", "CODE:ISSUER", or an Asset instance.',
    );
  }

  const trimmed = asset.trim();
  const lower = trimmed.toLowerCase();

  if (lower === 'xlm' || lower === 'native' || trimmed === '') {
    return Asset.native();
  }

  const parts = trimmed.split(':');

  if (parts.length !== 2) {
    throw new Error(
      `BLUX: Invalid asset "${asset}". Use "xlm", "native", or "CODE:ISSUER".`,
    );
  }

  const [code, issuer] = parts;

  if (!code || !issuer) {
    throw new Error(
      `BLUX: Invalid asset "${asset}". Use "xlm", "native", or "CODE:ISSUER".`,
    );
  }

  if (!StrKey.isValidEd25519PublicKey(issuer)) {
    throw new Error(`BLUX: Invalid issuer in asset "${asset}".`);
  }

  return new Asset(code, issuer);
};
