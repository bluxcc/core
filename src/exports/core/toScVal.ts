import { Address, xdr } from '@stellar/stellar-sdk';

/** A numeric value accepted in string, number, or bigint form. */
export type Numberish = string | number | bigint;

/**
 * Coerces a {@link Numberish} into a specific primitive type.
 *
 * @param val - The value to convert.
 * @param targetType - The primitive to coerce to: `'string'`, `'number'`, or `'bigint'`.
 * @returns `val` as the requested type.
 */
export const numberish = <T extends Numberish>(
  val: Numberish,
  targetType: 'string' | 'number' | 'bigint',
): T => {
  if (targetType === 'string') {
    return val.toString() as T;
  }

  if (targetType === 'number') {
    return Number(val) as T;
  }

  return BigInt(val) as T;
};

const bigintToBuffer = (
  bn: bigint,
  bitLength: number,
  signed: boolean,
): Buffer => {
  const numBytes = bitLength / 8;
  let hex = BigInt(bn).toString(16);

  if (signed && bn < BigInt(0)) {
    const maxVal = BigInt(1) << BigInt(bitLength);
    hex = (maxVal + bn).toString(16).replace(/^-/, '');
  }

  if (hex.length % 2 !== 0) {
    hex = `0${hex}`;
  }

  const requiredHexLength = numBytes * 2;
  while (hex.length < requiredHexLength) {
    hex = `0${hex}`;
  }

  if (hex.length > requiredHexLength) {
    throw new Error(
      `BLUX: BigNumber ${bn} overflows ${bitLength}-bit representation`,
    );
  }

  const u8 = new Uint8Array(numBytes);
  let i = 0;
  let j = 0;
  while (i < numBytes) {
    u8[i] = parseInt(hex.slice(j, j + 2), 16);
    i += 1;
    j += 2;
  }

  if (signed && bn < BigInt(0)) {
    u8[0] |= 0x80;
  }

  return Buffer.from(u8);
};

const bytesToBigint = (signed: boolean, ...bytes: number[]): bigint => {
  let b = BigInt(0);
  for (const byte of bytes) {
    b <<= BigInt(8);
    b |= BigInt(byte);
  }

  if (signed) {
    const msb = bytes[0] !== undefined ? bytes[0] & 0x80 : 0;
    if (msb !== 0) {
      const totalBits = BigInt(bytes.length * 8);
      const maxVal = BigInt(1) << totalBits;
      b = b - maxVal;
    }
  }
  return b;
};

const safeBigintToNumber = (bn: bigint): number => {
  if (
    bn > BigInt(Number.MAX_SAFE_INTEGER) ||
    bn < BigInt(Number.MIN_SAFE_INTEGER)
  ) {
    throw new Error(
      `BLUX: BigInt ${bn} is outside the safe integer range for Number type.`,
    );
  }
  return Number(bn);
};

const bigintToInt64 = (value: bigint): xdr.Int64 => {
  const val = value;
  const low = safeBigintToNumber(val & BigInt(0xffffffff));

  let signedHigh = Number((val >> BigInt(32)) & BigInt(0xffffffff));
  if (signedHigh >= 0x80000000) {
    signedHigh -= 0x100000000;
  }

  return new xdr.Int64([low, signedHigh]);
};

const bigintToUint64 = (value: bigint): xdr.Uint64 => {
  const low = safeBigintToNumber(value & BigInt(0xffffffff));
  const high = safeBigintToNumber((value >> BigInt(32)) & BigInt(0xffffffff));

  return new xdr.Uint64([low, high]);
};

const bigintToScvI128 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 128, true);
  const hiBuffer = buffer.subarray(0, 8);
  const loBuffer = buffer.subarray(8, 16);

  // @ts-ignore
  const hi = bigintToInt64(bytesToBigint(true, ...hiBuffer));
  // @ts-ignore
  const lo = bigintToUint64(bytesToBigint(false, ...loBuffer));

  return xdr.ScVal.scvI128(new xdr.Int128Parts({ lo, hi }));
};

const bigintToScvU128 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 128, false);
  const hiBuffer = buffer.subarray(0, 8);
  const loBuffer = buffer.subarray(8, 16);

  // @ts-ignore
  const hi = bigintToUint64(bytesToBigint(false, ...hiBuffer));
  // @ts-ignore
  const lo = bigintToUint64(bytesToBigint(false, ...loBuffer));

  return xdr.ScVal.scvU128(new xdr.UInt128Parts({ hi, lo }));
};

const bigintToScvI256 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 256, true);

  const hi_hi_buffer = buffer.subarray(0, 8);
  const hi_lo_buffer = buffer.subarray(8, 16);
  const lo_hi_buffer = buffer.subarray(16, 24);
  const lo_lo_buffer = buffer.subarray(24, 32);

  // @ts-ignore
  const hiHi = bigintToInt64(bytesToBigint(true, ...hi_hi_buffer));
  // @ts-ignore
  const hiLo = bigintToUint64(bytesToBigint(false, ...hi_lo_buffer));
  // @ts-ignore
  const loHi = bigintToUint64(bytesToBigint(false, ...lo_hi_buffer));
  // @ts-ignore
  const loLo = bigintToUint64(bytesToBigint(false, ...lo_lo_buffer));

  return xdr.ScVal.scvI256(new xdr.Int256Parts({ hiHi, hiLo, loHi, loLo }));
};

const bigintToScvU256 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 256, false);

  const hi_hi_buffer = buffer.subarray(0, 8);
  const hi_lo_buffer = buffer.subarray(8, 16);
  const lo_hi_buffer = buffer.subarray(16, 24);
  const lo_lo_buffer = buffer.subarray(24, 32);

  // @ts-ignore
  const hiHi = bigintToUint64(bytesToBigint(false, ...hi_hi_buffer));
  // @ts-ignore
  const hiLo = bigintToUint64(bytesToBigint(false, ...hi_lo_buffer));
  // @ts-ignore
  const loHi = bigintToUint64(bytesToBigint(false, ...lo_hi_buffer));
  // @ts-ignore
  const loLo = bigintToUint64(bytesToBigint(false, ...lo_lo_buffer));

  return xdr.ScVal.scvU256(new xdr.UInt256Parts({ hiHi, hiLo, loHi, loLo }));
};

/** Heuristic for whether a value should be treated as a leaf rather than a nested map. */
function isScValInstance(value: any): boolean {
  return typeof value !== 'object' || value === null || Array.isArray(value);
}

type MapEntry = Record<string, xdr.ScVal | Object>;

const simpleScvMap = (obj: null | MapEntry): xdr.ScVal => {
  if (!obj) {
    return xdr.ScVal.scvMap(null);
  }

  const arr = Object.entries(obj);

  const myarr = [];

  for (const [k, value] of arr) {
    const key = typeof k === 'string' ? ToScVal.symbol(k) : k;

    if (
      typeof value === 'object' &&
      value !== null &&
      !isScValInstance(value)
    ) {
      myarr.push(
        new xdr.ScMapEntry({
          key,
          val: simpleScvMap(value as MapEntry),
        }),
      );
    } else {
      myarr.push(
        new xdr.ScMapEntry({
          key,
          val: value as xdr.ScVal,
        }),
      );
    }
  }

  return xdr.ScVal.scvMap(myarr);
};

/**
 * Encoders that turn JS values into Soroban {@link xdr.ScVal} arguments for
 * {@link readContracts} / {@link writeContract} calls. Each method maps to one
 * Soroban value type.
 */
export class ToScVal {
  /** Encodes a signed 32-bit integer (`i32`). */
  public static i32(value: Numberish): xdr.ScVal {
    const val = numberish<number>(value, 'number');

    return xdr.ScVal.scvI32(val);
  }
  /** Encodes a signed 64-bit integer (`i64`). */
  public static i64(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return xdr.ScVal.scvI64(bigintToInt64(val));
  }
  /** Encodes a signed 128-bit integer (`i128`). */
  public static i128(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvI128(val);
  }
  /** Encodes a signed 256-bit integer (`i256`). */
  public static i256(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvI256(val);
  }
  /** Encodes an unsigned 32-bit integer (`u32`). */
  public static u32(value: Numberish): xdr.ScVal {
    const val = numberish<number>(value, 'number');

    return xdr.ScVal.scvU32(val);
  }
  /** Encodes an unsigned 64-bit integer (`u64`). */
  public static u64(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return xdr.ScVal.scvU64(bigintToUint64(val));
  }
  /** Encodes an unsigned 128-bit integer (`u128`). */
  public static u128(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvU128(val);
  }
  /** Encodes an unsigned 256-bit integer (`u256`). */
  public static u256(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvU256(val);
  }

  /** Encodes a contract error value. */
  public static error(value: xdr.ScError): xdr.ScVal {
    return xdr.ScVal.scvError(value);
  }
  /** Encodes a duration (seconds, as an unsigned 64-bit value). */
  public static duration(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');
    const v = bigintToUint64(val);

    return xdr.ScVal.scvDuration(v);
  }
  /** Encodes a timepoint (Unix seconds, as an unsigned 64-bit value). */
  public static timepoint(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');
    const v = bigintToUint64(val);

    return xdr.ScVal.scvTimepoint(v);
  }
  /** Encodes a ledger-key nonce. */
  public static ledgerKeyNonce(value: xdr.ScNonceKey): xdr.ScVal {
    return xdr.ScVal.scvLedgerKeyNonce(value);
  }
  /** Encodes a contract instance value. */
  public static contractInstance(value: xdr.ScContractInstance): xdr.ScVal {
    return xdr.ScVal.scvContractInstance(value);
  }
  /** Encodes a map from pre-built {@link xdr.ScMapEntry} entries (or `null`). */
  public static scvMap(value: null | xdr.ScMapEntry[]): xdr.ScVal {
    return xdr.ScVal.scvMap(value);
  }
  /** Encodes a map from a plain object, recursing into nested objects (keys become symbols). */
  public static map(value: MapEntry | null): xdr.ScVal {
    return simpleScvMap(value);
  }
  /** Encodes a string value. */
  public static string(value: string | Buffer): xdr.ScVal {
    return xdr.ScVal.scvString(value);
  }
  /** Encodes a vector of pre-built ScVals (or `null`). */
  public static vec(value: null | xdr.ScVal[]): xdr.ScVal {
    return xdr.ScVal.scvVec(value);
  }
  /** Encodes the void value. */
  public static void(): xdr.ScVal {
    return xdr.ScVal.scvVoid();
  }
  /** Encodes a raw byte array. */
  public static bytes(value: Buffer): xdr.ScVal {
    return xdr.ScVal.scvBytes(value);
  }
  /** Encodes the ledger-key for a contract instance. */
  public static ledgerKeyContractInstance(): xdr.ScVal {
    return xdr.ScVal.scvLedgerKeyContractInstance();
  }
  /** Encodes a symbol (short identifier, e.g. a function or enum name). */
  public static symbol(symbol: string | Buffer): xdr.ScVal {
    return xdr.ScVal.scvSymbol(symbol);
  }
  /** Encodes a boolean. */
  public static boolean(bool: boolean): xdr.ScVal {
    return xdr.ScVal.scvBool(bool);
  }
  /** Encodes an address — an account (`G...`) or contract (`C...`). */
  public static address(address: string): xdr.ScVal {
    return Address.fromString(address).toScVal();
  }
}
