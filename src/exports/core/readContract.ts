import { Address, xdr } from '@stellar/stellar-sdk';

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
      `BigNumber ${bn} overflows ${bitLength}-bit representation`,
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
      `BigInt ${bn} is outside the safe integer range for Number type.`,
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

  const hi = bigintToInt64(bytesToBigint(true, ...hiBuffer));
  const lo = bigintToUint64(bytesToBigint(false, ...loBuffer));

  return xdr.ScVal.scvI128(new xdr.Int128Parts({ lo, hi }));
};

const bigintToScvU128 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 128, false); // Unsigned 128-bit
  const hiBuffer = buffer.subarray(0, 8);
  const loBuffer = buffer.subarray(8, 16);

  const hi = bigintToUint64(bytesToBigint(false, ...hiBuffer));
  const lo = bigintToUint64(bytesToBigint(false, ...loBuffer));

  return xdr.ScVal.scvU128(new xdr.UInt128Parts({ hi, lo }));
};

const bigintToScvI256 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 256, true); // Signed 256-bit

  const hi_hi_buffer = buffer.subarray(0, 8);
  const hi_lo_buffer = buffer.subarray(8, 16);
  const lo_hi_buffer = buffer.subarray(16, 24);
  const lo_lo_buffer = buffer.subarray(24, 32);

  const hiHi = bigintToInt64(bytesToBigint(true, ...hi_hi_buffer));
  const hiLo = bigintToUint64(bytesToBigint(false, ...hi_lo_buffer));
  const loHi = bigintToUint64(bytesToBigint(false, ...lo_hi_buffer));
  const loLo = bigintToUint64(bytesToBigint(false, ...lo_lo_buffer));

  return xdr.ScVal.scvI256(new xdr.Int256Parts({ hiHi, hiLo, loHi, loLo }));
};

const bigintToScvU256 = (value: bigint): xdr.ScVal => {
  const buffer = bigintToBuffer(value, 256, false); // Unsigned 256-bit

  const hi_hi_buffer = buffer.subarray(0, 8);
  const hi_lo_buffer = buffer.subarray(8, 16);
  const lo_hi_buffer = buffer.subarray(16, 24);
  const lo_lo_buffer = buffer.subarray(24, 32);

  const hiHi = bigintToUint64(bytesToBigint(false, ...hi_hi_buffer));
  const hiLo = bigintToUint64(bytesToBigint(false, ...hi_lo_buffer));
  const loHi = bigintToUint64(bytesToBigint(false, ...lo_hi_buffer));
  const loLo = bigintToUint64(bytesToBigint(false, ...lo_lo_buffer));

  return xdr.ScVal.scvU256(new xdr.UInt256Parts({ hiHi, hiLo, loHi, loLo }));
};

class ToScVal {
  public static i128(value: bigint): xdr.ScVal {
    return bigintToScvI128(value);
  }
  public static i256(value: bigint): xdr.ScVal {
    return bigintToScvI256(value);
  }
  public static u32(number: number): xdr.ScVal {
    if (number < 0 || number > 0xffffffff || !Number.isInteger(number)) {
      throw new Error(
        `Value ${number} is not a valid unsigned 32-bit integer.`,
      );
    }
    return xdr.ScVal.scvU32(number);
  }
  public static u64(number: string | bigint): xdr.ScVal {
    const bn = typeof number === 'string' ? BigInt(number) : number;
    if (bn < BigInt(0) || bn > BigInt('0xFFFFFFFFFFFFFFFF')) {
      throw new Error(`BigInt ${bn} is not a valid unsigned 64-bit integer.`);
    }
    return xdr.ScVal.scvU64(bigintToUint64(bn)); // Use our helper for consistency
  }
  public static u128(value: bigint): xdr.ScVal {
    return bigintToScvU128(value);
  }
  public static u256(value: bigint): xdr.ScVal {
    return bigintToScvU256(value);
  }
  public static symbol(symbol: string): xdr.ScVal {
    return xdr.ScVal.scvSymbol(symbol);
  }
  public static boolean(bool: boolean): xdr.ScVal {
    return xdr.ScVal.scvBool(bool);
  }
  public static address(address: string): xdr.ScVal {
    return Address.fromString(address).toScVal();
  }
}

export default ToScVal;
