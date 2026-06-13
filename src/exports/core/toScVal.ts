import { Address, xdr } from '@stellar/stellar-sdk';

export type Numberish = string | number | bigint;

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
  const low = safeBigintToNumber(value & BigInt(0xffffffff)); // Lower 32 bits
  const high = safeBigintToNumber((value >> BigInt(32)) & BigInt(0xffffffff)); // Upper 32 bits

  return new xdr.Uint64([low, high]);
};

const bigintToScvI128 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 128, true); // Signed 128-bit
  const hiBuffer = buffer.subarray(0, 8);
  const loBuffer = buffer.subarray(8, 16);

  // @ts-ignore
  const hi = bigintToInt64(bytesToBigint(true, ...hiBuffer));
  // @ts-ignore
  const lo = bigintToUint64(bytesToBigint(false, ...loBuffer));

  return xdr.ScVal.scvI128(new xdr.Int128Parts({ lo, hi }));
};

const bigintToScvU128 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 128, false); // Unsigned 128-bit
  const hiBuffer = buffer.subarray(0, 8);
  const loBuffer = buffer.subarray(8, 16);

  // @ts-ignore
  const hi = bigintToUint64(bytesToBigint(false, ...hiBuffer));
  // @ts-ignore
  const lo = bigintToUint64(bytesToBigint(false, ...loBuffer));

  return xdr.ScVal.scvU128(new xdr.UInt128Parts({ hi, lo }));
};

const bigintToScvI256 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 256, true); // Signed 256-bit

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
  const buffer = bigintToBuffer(value, 256, false); // Unsigned 256-bit

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

function isScValInstance(value: any): boolean {
  // todo:
  // todo:
  // todo:
  // Adjust this check based on the actual structure of xdr.ScVal
  // For example, if ScVal objects have a specific 'type' property:
  // return typeof value === 'object' && value !== null && 'type' in value;
  // Or if using classes: return value instanceof xdr.ScVal;
  // For now, a basic check assuming it's not a plain object needing recursion.
  return typeof value !== 'object' || value === null || Array.isArray(value); // Simplistic check
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

export class ToScVal {
  public static i32(value: Numberish): xdr.ScVal {
    const val = numberish<number>(value, 'number');

    return xdr.ScVal.scvI32(val);
  }
  public static i64(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return xdr.ScVal.scvI64(bigintToInt64(val));
  }
  public static i128(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvI128(val);
  }
  public static i256(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvI256(val);
  }
  public static u32(value: Numberish): xdr.ScVal {
    const val = numberish<number>(value, 'number');

    return xdr.ScVal.scvU32(val);
  }
  public static u64(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return xdr.ScVal.scvU64(bigintToUint64(val));
  }
  public static u128(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvU128(val);
  }
  public static u256(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');

    return bigintToScvU256(val);
  }

  public static error(value: xdr.ScError): xdr.ScVal {
    return xdr.ScVal.scvError(value);
  }
  public static duration(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');
    const v = bigintToUint64(val);

    return xdr.ScVal.scvDuration(v);
  }
  public static timepoint(value: Numberish): xdr.ScVal {
    const val = numberish<bigint>(value, 'bigint');
    const v = bigintToUint64(val);

    return xdr.ScVal.scvTimepoint(v);
  }
  public static ledgerKeyNonce(value: xdr.ScNonceKey): xdr.ScVal {
    return xdr.ScVal.scvLedgerKeyNonce(value);
  }
  public static contractInstance(value: xdr.ScContractInstance): xdr.ScVal {
    return xdr.ScVal.scvContractInstance(value);
  }
  public static scvMap(value: null | xdr.ScMapEntry[]): xdr.ScVal {
    return xdr.ScVal.scvMap(value);
  }
  public static map(value: MapEntry | null): xdr.ScVal {
    return simpleScvMap(value);
  }
  public static string(value: string | Buffer): xdr.ScVal {
    return xdr.ScVal.scvString(value);
  }
  public static vec(value: null | xdr.ScVal[]): xdr.ScVal {
    return xdr.ScVal.scvVec(value);
  }
  public static void(): xdr.ScVal {
    return xdr.ScVal.scvVoid();
  }
  public static bytes(value: Buffer): xdr.ScVal {
    return xdr.ScVal.scvBytes(value);
  }
  public static ledgerKeyContractInstance(): xdr.ScVal {
    return xdr.ScVal.scvLedgerKeyContractInstance();
  }
  public static symbol(symbol: string | Buffer): xdr.ScVal {
    return xdr.ScVal.scvSymbol(symbol);
  }
  public static boolean(bool: boolean): xdr.ScVal {
    return xdr.ScVal.scvBool(bool);
  }
  public static address(address: string): xdr.ScVal {
    return Address.fromString(address).toScVal();
  }
}
