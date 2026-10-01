import { contract, rpc, xdr } from '@stellar/stellar-sdk';

import { resolveAddress } from './helpers/resolveAddress';

/**
 * Contract specs are only shared while they are being fetched. This avoids
 * duplicate RPC work for batched reads without keeping a stale spec after a
 * contract upgrades its Wasm.
 */
const inFlightSpecs = new WeakMap<
  rpc.Server,
  Map<string, Promise<contract.Spec>>
>();

const getContractSpec = (
  address: string,
  soroban: rpc.Server,
  networkPassphrase: string,
): Promise<contract.Spec> => {
  let specs = inFlightSpecs.get(soroban);
  if (!specs) {
    specs = new Map();
    inFlightSpecs.set(soroban, specs);
  }

  const cached = specs.get(address);
  if (cached) {
    return cached;
  }

  const pending = contract.Client.from({
    contractId: address,
    networkPassphrase,
    rpcUrl: soroban.serverURL.toString(),
    server: soroban,
  }).then((client) => client.spec);

  specs.set(address, pending);

  const clear = () => {
    if (specs?.get(address) === pending) {
      specs.delete(address);
    }
  };
  void pending.then(clear, clear);

  return pending;
};

const normalizeInteger = (value: unknown, type: xdr.ScSpecTypeDef): unknown => {
  const isIntegerType =
    type.type === 'scSpecTypeU32' ||
    type.type === 'scSpecTypeI32' ||
    type.type === 'scSpecTypeU64' ||
    type.type === 'scSpecTypeI64' ||
    type.type === 'scSpecTypeU128' ||
    type.type === 'scSpecTypeI128' ||
    type.type === 'scSpecTypeU256' ||
    type.type === 'scSpecTypeI256' ||
    type.type === 'scSpecTypeTimepoint' ||
    type.type === 'scSpecTypeDuration';

  if (!isIntegerType) {
    return value;
  }

  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new RangeError(
        `Number ${value} is not a safe integer; pass it as a bigint or decimal string instead`,
      );
    }
    return value;
  }

  // The Stellar SDK accepts decimal strings for wide integers, but its
  // spec encoder expects u32/i32 values as numbers. Coerce those two only
  // after BigInt has verified that the string contains an integer.
  if (typeof value === 'string') {
    const decimal = value.trim();
    if (!/^[+-]?\d+$/.test(decimal)) {
      throw new TypeError(`Expected a decimal integer, received "${value}"`);
    }

    const integer = BigInt(decimal);

    if (type.type === 'scSpecTypeU32') {
      if (integer < BigInt(0) || integer > BigInt(4_294_967_295)) {
        throw new RangeError(`Value ${value} is out of range for u32`);
      }
      return Number(integer);
    }

    if (type.type === 'scSpecTypeI32') {
      if (integer < BigInt(-2_147_483_648) || integer > BigInt(2_147_483_647)) {
        throw new RangeError(`Value ${value} is out of range for i32`);
      }
      return Number(integer);
    }

    return decimal;
  }

  return value;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Resolves human-readable addresses anywhere the contract ABI declares an
 * address, including inside options, vectors, tuples, maps, structs, or union
 * cases. Other values are passed through for the SDK's spec encoder.
 */
const normalizeNativeValue = async (
  value: unknown,
  type: xdr.ScSpecTypeDef,
  spec: contract.Spec,
): Promise<unknown> => {
  if (xdr.ScVal.is(value)) {
    return value;
  }

  switch (type.type) {
    case 'scSpecTypeAddress':
      if (typeof value !== 'string') {
        return value;
      }

      // This is the only branch allowed to resolve human-readable addresses.
      // A value such as "alice.xlm" must remain literal when the ABI declares
      // it as a string, symbol, bytes value, or any other non-address type.
      return (await resolveAddress(value, { expected: 'soroban' })).address;

    case 'scSpecTypeOption':
      if (value === null || value === undefined) {
        return value;
      }
      return normalizeNativeValue(value, type.value.valueType, spec);

    case 'scSpecTypeVec':
      if (!Array.isArray(value)) {
        return value;
      }
      return Promise.all(
        value.map((item) =>
          normalizeNativeValue(item, type.value.elementType, spec),
        ),
      );

    case 'scSpecTypeTuple':
      if (!Array.isArray(value)) {
        return value;
      }
      return Promise.all(
        value.map((item, index) =>
          type.value.valueTypes[index]
            ? normalizeNativeValue(item, type.value.valueTypes[index], spec)
            : item,
        ),
      );

    case 'scSpecTypeMap': {
      const normalizeEntry = async ([key, entryValue]: [unknown, unknown]) =>
        [
          await normalizeNativeValue(key, type.value.keyType, spec),
          await normalizeNativeValue(entryValue, type.value.valueType, spec),
        ] as [unknown, unknown];

      if (value instanceof Map) {
        return new Map(
          await Promise.all(Array.from(value.entries()).map(normalizeEntry)),
        );
      }

      if (Array.isArray(value)) {
        return Promise.all(
          value.map((entry) =>
            Array.isArray(entry) && entry.length >= 2
              ? normalizeEntry([entry[0], entry[1]])
              : entry,
          ),
        );
      }

      return value;
    }

    case 'scSpecTypeUdt': {
      if (!isRecord(value) && !Array.isArray(value)) {
        return value;
      }

      const entry = spec.findEntry(type.value.name.toString());

      if (entry.type === 'scSpecEntryUdtStructV0') {
        const fields = entry.value.fields;
        const numericFields = fields.every((field) =>
          /^\d+$/.test(field.name.toString()),
        );

        if (numericFields && Array.isArray(value)) {
          return Promise.all(
            fields.map((field, index) =>
              normalizeNativeValue(value[index], field.type, spec),
            ),
          );
        }

        if (!Array.isArray(value)) {
          const normalized = { ...value };
          await Promise.all(
            fields.map(async (field) => {
              const name = field.name.toString();
              normalized[name] = await normalizeNativeValue(
                value[name],
                field.type,
                spec,
              );
            }),
          );
          return normalized;
        }
      }

      if (
        entry.type === 'scSpecEntryUdtUnionV0' &&
        !Array.isArray(value) &&
        typeof value.tag === 'string'
      ) {
        const unionCase = entry.value.cases.find(
          (candidate) => candidate.value.name.toString() === value.tag,
        );

        if (
          unionCase?.type === 'scSpecUdtUnionCaseTupleV0' &&
          Array.isArray(value.values)
        ) {
          return {
            ...value,
            values: await Promise.all(
              value.values.map((item, index) =>
                unionCase.value.type[index]
                  ? normalizeNativeValue(
                      item,
                      unionCase.value.type[index],
                      spec,
                    )
                  : item,
              ),
            ),
          };
        }
      }

      return value;
    }

    default:
      return normalizeInteger(value, type);
  }
};

const describeType = (type: xdr.ScSpecTypeDef): string =>
  type.type.replace('scSpecType', '').toLowerCase();

/**
 * Converts positional native arguments into ScVals using the deployed
 * contract's spec. Existing ScVals pass through unchanged.
 */
export const contractArgsToScVals = async (
  address: string,
  fn: string,
  args: unknown[],
  soroban: rpc.Server,
  networkPassphrase: string,
  callLabel: string,
): Promise<xdr.ScVal[]> => {
  if (!Array.isArray(args)) {
    throw new Error(`BLUX: ${callLabel}.args must be an array`);
  }

  // Preserve the old API without adding contract-spec requests for callers
  // that already encode every argument themselves.
  if (args.every((arg) => xdr.ScVal.is(arg))) {
    return args;
  }

  const spec = await getContractSpec(address, soroban, networkPassphrase);
  const inputs = spec.getFunc(fn).inputs;

  if (args.length !== inputs.length) {
    throw new Error(
      `BLUX: ${callLabel}.args expected ${inputs.length} value${inputs.length === 1 ? '' : 's'} for ${address}.${fn}, received ${args.length}`,
    );
  }

  return Promise.all(
    inputs.map(async (input, index) => {
      const value = args[index];
      if (xdr.ScVal.is(value)) {
        return value;
      }

      try {
        return spec.nativeToScVal(
          await normalizeNativeValue(value, input.type, spec),
          input.type,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(
          `BLUX: Could not encode ${callLabel}.args[${index}] (${input.name.toString()}: ${describeType(input.type)}): ${message}`,
        );
      }
    }),
  );
};
