import { Networks, StrKey } from '@stellar/stellar-sdk';

import { ICustomToken } from '../types';
import { ApiTokenView } from './api';
import { ToScVal } from '../exports/core/toScVal';
import { IContractCall } from '../exports/utils';
import { readContracts } from '../exports/core/readContracts';

/**
 * Maps a network passphrase to the API's token bucket. The Blux API only stores
 * tokens for mainnet/testnet, so every non-public network maps to `'testnet'`
 * (matching the curated-asset-meta convention in {@link networkSlug}).
 */
export const apiNetworkSlug = (
  activeNetwork?: string,
): 'mainnet' | 'testnet' =>
  activeNetwork === Networks.PUBLIC ? 'mainnet' : 'testnet';

/**
 * Converts a raw i128 token amount (as returned by `balance`) into a
 * human-readable decimal string, without floating-point precision loss.
 */
export const formatTokenAmount = (raw: string, decimals: number): string => {
  if (!raw) return '0';
  if (!decimals) return raw;

  const negative = raw.startsWith('-');
  const digits = (negative ? raw.slice(1) : raw).padStart(decimals + 1, '0');
  const whole = digits.slice(0, digits.length - decimals);
  const fraction = digits.slice(digits.length - decimals).replace(/0+$/, '');

  return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
};

/** A classic Stellar asset that a SAC wraps, derived from its on-chain `name()`. */
export type SacClassicAsset =
  | { type: 'native' }
  | { type: 'credit'; code: string; issuer: string };

/**
 * Derives the classic asset a Stellar Asset Contract wraps from its on-chain
 * `name()`: a SAC reports `"native"` for XLM and `"CODE:ISSUER"` for credit
 * assets (e.g. `"USDC:GBBD…"`). Returns `null` for a non-SAC custom token, whose
 * `name()` is a free-form string. Used both to show a short name and to detect a
 * token the user already holds as a classic asset.
 */
export const sacToClassicAsset = (name: string): SacClassicAsset | null => {
  if (name === 'native') return { type: 'native' };

  const idx = name.indexOf(':');
  if (idx === -1) return null;

  const code = name.slice(0, idx);
  const issuer = name.slice(idx + 1);

  if (!code || !StrKey.isValidEd25519PublicKey(issuer)) return null;

  return { type: 'credit', code, issuer };
};

/**
 * A short, layout-safe display name for a token. SAC-wrapped classic assets
 * report `name()` as the long `"CODE:ISSUER"`, so fall back to the symbol; XLM
 * reports `"native"`.
 */
export const tokenDisplayName = (name: string, symbol: string): string => {
  if (name === 'native') return symbol || 'XLM';
  if (name.includes(':')) return symbol || name.split(':')[0];

  return name || symbol;
};

/**
 * The `(code, issuer)` to feed AssetLogo so a SAC-wrapped classic asset resolves
 * its real curated logo; non-classic tokens get an empty issuer and fall back to
 * the generic icon. Never resolves to the native XLM / Stellar glyph.
 */
export const tokenLogoAsset = (
  name: string,
  symbol: string,
): { code: string; issuer: string } => {
  const classic = sacToClassicAsset(name);

  if (classic && classic.type === 'credit') {
    return { code: classic.code, issuer: classic.issuer };
  }

  return { code: symbol, issuer: '' };
};

/** The on-chain shape of a SAC / SEP-41 token, read by {@link readTokenOnChain}. */
export interface TokenOnChain {
  name: string;
  symbol: string;
  decimals: number;
  /** Raw i128 balance for `accountAddress`; `'0'` when no account was given. */
  rawBalance: string;
  /** Human-readable balance (`rawBalance` scaled by `decimals`). */
  balance: string;
  /** admin() (SACs) or owner() (custom tokens), whichever the contract exposes. */
  adminOrOwner?: string;
}

// SACs expose admin(); custom tokens commonly expose owner() instead. Try both,
// each on its own simulation so a missing entrypoint can't fail the whole read.
const readAdminOrOwner = async (
  address: string,
  network?: string,
): Promise<string | undefined> => {
  for (const fn of ['admin', 'owner']) {
    try {
      const res = await readContracts([{ address, fn, args: [] }], { network });

      if (!Array.isArray(res) && res.values[0] != null) {
        return String(res.values[0]);
      }
    } catch {
      // Entrypoint absent on this contract — fall through to the next.
    }
  }

  return undefined;
};

/**
 * Reads a token contract's on-chain state by simulating its read-only
 * entrypoints — no account, signing, or fees required. `name`/`symbol`/
 * `decimals` are the standard SEP-41 interface; `balance` is read for
 * `accountAddress` when given; `adminOrOwner` is best-effort.
 *
 * @throws If `contractAddress` is not a contract id, or it is missing the
 *   standard `name`/`symbol`/`decimals` entrypoints (i.e. not a token).
 */
export const readTokenOnChain = async (
  contractAddress: string,
  accountAddress?: string,
  network?: string,
): Promise<TokenOnChain> => {
  if (!StrKey.isValidContract(contractAddress)) {
    throw new Error('BLUX: invalid token contract id');
  }

  const calls: IContractCall[] = [
    { address: contractAddress, fn: 'name', args: [] },
    { address: contractAddress, fn: 'symbol', args: [] },
    { address: contractAddress, fn: 'decimals', args: [] },
  ];

  if (accountAddress) {
    calls.push({
      address: contractAddress,
      fn: 'balance',
      args: [ToScVal.address(accountAddress)],
    });
  }

  const meta = await readContracts(calls, { network });

  // readContracts only returns an array for an empty call list.
  if (Array.isArray(meta)) {
    throw new Error('BLUX: could not read token metadata');
  }

  const [name, symbol, decimals, rawBalance] = meta.values;
  const dec = Number(decimals);
  const raw = accountAddress && rawBalance != null ? String(rawBalance) : '0';

  return {
    name: String(name),
    symbol: String(symbol),
    decimals: dec,
    rawBalance: raw,
    balance: formatTokenAmount(raw, dec),
    adminOrOwner: await readAdminOrOwner(contractAddress, network),
  };
};

/**
 * Reads just a token's `balance` for an account in a single simulation and
 * formats it with an already-known `decimals` — far lighter than
 * {@link readTokenOnChain} for the periodic balance refresh. Returns `'0'` on
 * any failure so a single unreachable token can't break the others.
 */
export const readTokenBalance = async (
  contractAddress: string,
  accountAddress: string,
  decimals: number,
  network?: string,
): Promise<string> => {
  const res = await readContracts(
    [
      {
        address: contractAddress,
        fn: 'balance',
        args: [ToScVal.address(accountAddress)],
      },
    ],
    { network },
  );

  if (Array.isArray(res) || res.values[0] == null) {
    return '0';
  }

  return formatTokenAmount(String(res.values[0]), decimals);
};

/**
 * Maps an API `TokenView` to the store's {@link ICustomToken}, attaching a
 * (separately read) on-chain balance.
 */
export const apiTokenToCustomToken = (
  view: ApiTokenView,
  balance = '0',
): ICustomToken => ({
  id: view.id,
  contractAddress: view.contract_address,
  network: view.network === 'mainnet' ? 'mainnet' : 'testnet',
  name: view.name,
  symbol: view.symbol,
  decimals: view.decimals,
  balance,
});
