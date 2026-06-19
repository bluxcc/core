import { StrKey } from '@stellar/stellar-sdk';

import { readContracts } from './readContracts';
import { checkConfigCreated } from '../utils';

/** Options for {@link getTokenMetadata}. */
export type GetTokenMetadataOptions = {
  /** Network passphrase to read from. Defaults to the active network. */
  network?: string;
};

/** Metadata read from a SEP-41 token / Stellar Asset Contract. */
export type TokenMetadata = {
  /** Number of decimal places the token uses. */
  decimals: number;
  /** Human-readable token name. */
  name: string;
  /** Token symbol / code. */
  symbol: string;
  /**
   * The token's owner, when the contract exposes an `owner()` function. Absent
   * for contracts without one — notably Stellar Asset Contracts, which expose
   * `admin()` rather than `owner()`.
   */
  owner?: string;
};

/**
 * Reads a token contract's metadata by simulating its read-only entrypoints — no
 * account, signing, or fees required. `decimals`, `name`, and `symbol` come from
 * the standard SEP-41 token interface; `owner` is read separately and omitted
 * when the contract has no `owner()` function.
 *
 * @param address - The token contract id (`C...`), e.g. a SAC from {@link getSacAddress}.
 * @param options - Network to read from.
 * @returns The token's {@link TokenMetadata}.
 * @throws If called before {@link createConfig}, if `address` is not a contract id, or if the contract is missing the standard `decimals`/`name`/`symbol` entrypoints.
 */
export const getTokenMetadata = async (
  address: string,
  options: GetTokenMetadataOptions = {},
): Promise<TokenMetadata> => {
  if (!checkConfigCreated()) {
    throw new Error('BLUX: getTokenMetadata must be called after createConfig');
  }

  if (!address || !StrKey.isValidContract(address)) {
    throw new Error(
      'BLUX: getTokenMetadata requires a token contract id (C...).',
    );
  }

  const { network } = options;

  const meta = await readContracts(
    [
      { address, fn: 'decimals', args: [] },
      { address, fn: 'name', args: [] },
      { address, fn: 'symbol', args: [] },
    ],
    { network },
  );

  // readContracts only returns an array for an empty call list; the three calls
  // above always yield the object form.
  if (Array.isArray(meta)) {
    throw new Error('BLUX: getTokenMetadata could not read the token.');
  }

  const [decimals, name, symbol] = meta.values;

  // owner() is not part of the standard token interface, so read it on its own:
  // a contract without it still returns the rest of the metadata.
  let owner: string | undefined;

  try {
    const ownerResult = await readContracts(
      [{ address, fn: 'owner', args: [] }],
      { network },
    );

    if (!Array.isArray(ownerResult)) {
      const value = ownerResult.values[0];

      owner = value == null ? undefined : String(value);
    }
  } catch {
    owner = undefined;
  }

  return {
    decimals: Number(decimals),
    name: String(name),
    symbol: String(symbol),
    owner,
  };
};
