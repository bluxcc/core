import { StrKey, Federation, extractBaseAddress } from '@stellar/stellar-sdk';

/** The outcome of resolving a recipient with {@link resolveAddress}. */
export type ResolvedAddress = {
  /**
   * The address to drop into an operation. A muxed (`M...`) input is preserved
   * here so its embedded memo id survives a classic payment; for every other
   * input this equals {@link ResolvedAddress.publicKey}.
   */
  destination: string;
  /**
   * The underlying Ed25519 account id (`G...`). Use this for account-existence
   * lookups, createAccount destinations, and claimable-balance claimants — none
   * of which accept a muxed address.
   */
  publicKey: string;
  /** The memo a federation record asks senders to attach, when it provided one. */
  memo?: string;
  /** The type of {@link ResolvedAddress.memo} (`text` | `id` | `hash` | `return`). */
  memoType?: string;
  /** `true` when the input was a federated address that required a network lookup. */
  federated: boolean;
};

/**
 * Reduces an address to the base Ed25519 account that actually exists on the
 * ledger (a muxed `M...` address wraps one such account).
 *
 * @param address - A `G...` or `M...` address.
 * @returns The base `G...` account id.
 * @throws If `address` is neither a valid Ed25519 nor muxed key.
 */
const toBasePublicKey = (address: string): string => {
  if (StrKey.isValidEd25519PublicKey(address)) {
    return address;
  }

  if (StrKey.isValidMed25519PublicKey(address)) {
    return extractBaseAddress(address);
  }

  throw new Error(`BLUX: Resolved an invalid account id "${address}".`);
};

/**
 * Turns whatever a caller passed as a recipient into a usable account id:
 *
 * - A valid Stellar address (`G...` or muxed `M...`) is used as-is.
 * - A SEP-2 federated address (e.g. `alice*example.com`) is looked up against
 *   the domain's federation server.
 * - Anything else throws, so a transaction is never built toward garbage.
 *
 * @param value - An address or federated address.
 * @param opts - Optional federation lookup options (e.g. `timeout`, `allowHttp`).
 * @returns The resolved address details — see {@link ResolvedAddress}.
 * @throws If the value is neither a valid address nor a resolvable federated address.
 */
export const resolveAddress = async (
  value: string,
  opts?: Federation.Api.Options,
): Promise<ResolvedAddress> => {
  const trimmed = (value ?? '').toString().trim();

  if (!trimmed) {
    throw new Error('BLUX: A destination address is required.');
  }

  if (
    StrKey.isValidEd25519PublicKey(trimmed) ||
    StrKey.isValidMed25519PublicKey(trimmed)
  ) {
    return {
      destination: trimmed,
      publicKey: toBasePublicKey(trimmed),
      federated: false,
    };
  }

  if (!trimmed.includes('*')) {
    throw new Error(
      `BLUX: "${trimmed}" is not a valid Stellar address or federated address.`,
    );
  }

  let record: Federation.Api.Record;

  try {
    record = await Federation.Server.resolve(trimmed, opts);
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : 'lookup failed';

    throw new Error(
      `BLUX: Could not resolve federated address "${trimmed}": ${reason}`,
    );
  }

  return {
    destination: record.account_id,
    publicKey: toBasePublicKey(record.account_id),
    memo: record.memo,
    memoType: record.memo_type,
    federated: true,
  };
};

/**
 * Convenience wrapper for the common "I only need the account id" case (Horizon
 * query filters such as `forAccount`/`sponsor`/`claimant`). Passes `undefined`
 * through untouched so optional filters stay optional, and resolves everything
 * else — including federated addresses — down to its base Ed25519 key.
 *
 * @param address - An optional address or federated address.
 * @returns The base `G...` key, or `undefined` when no address was given.
 * @throws If a non-empty `address` is neither valid nor resolvable.
 */
export const resolveAddressKey = async (
  address?: string,
): Promise<string | undefined> => {
  if (!address) {
    return undefined;
  }

  return (await resolveAddress(address)).publicKey;
};
