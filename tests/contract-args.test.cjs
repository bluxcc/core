const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const stellar = require('@stellar/stellar-sdk');

const root = resolve(__dirname, '..');

function createLoader({ spec, resolveAddress }) {
  const cache = new Map();
  const sdk = {
    ...stellar,
    contract: {
      ...stellar.contract,
      Client: {
        from: async () => ({ spec }),
      },
    },
  };

  const load = (path) => {
    const base = resolve(root, path);
    if (base.endsWith('/helpers/resolveAddress')) {
      return { resolveAddress };
    }

    const file = [base, `${base}.ts`].find(
      (candidate) => candidate.endsWith('.ts') && existsSync(candidate),
    );
    assert.ok(file, `Missing test module: ${path}`);
    if (cache.has(file)) return cache.get(file).exports;

    const module = { exports: {} };
    cache.set(file, module);
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    });

    vm.runInNewContext(
      outputText,
      {
        module,
        exports: module.exports,
        require: (name) =>
          name === '@stellar/stellar-sdk'
            ? sdk
            : load(resolve(dirname(file), name)),
      },
      { filename: file },
    );

    return module.exports;
  };

  return load;
}

const addressType = { type: 'scSpecTypeAddress' };
const stringType = { type: 'scSpecTypeString' };
const profileType = {
  type: 'scSpecTypeUdt',
  value: { name: { toString: () => 'Profile' } },
};
const profileEntry = {
  type: 'scSpecEntryUdtStructV0',
  value: {
    fields: [
      {
        name: { toString: () => 'owner' },
        type: addressType,
      },
      {
        name: { toString: () => 'delegates' },
        type: {
          type: 'scSpecTypeVec',
          value: { elementType: addressType },
        },
      },
      {
        name: { toString: () => 'label' },
        type: stringType,
      },
    ],
  },
};

test('native Soroban address arguments resolve at every ABI-declared depth', async () => {
  const resolved = {
    'owner.xlm': stellar.Keypair.random().publicKey(),
    'delegate.xlm': stellar.Keypair.random().publicKey(),
  };
  const seen = [];
  const spec = {
    getFunc: () => ({
      inputs: [
        {
          name: { toString: () => 'profile' },
          type: profileType,
        },
      ],
    }),
    findEntry: () => profileEntry,
    nativeToScVal: (value) => value,
  };
  const load = createLoader({
    spec,
    resolveAddress: async (value, options) => {
      seen.push({ value, expected: options.expected });
      return { address: resolved[value] };
    },
  });
  const { contractArgsToScVals } = load('src/exports/core/contractArgs');

  const [profile] = await contractArgsToScVals(
    'CFAKE',
    'set_profile',
    [
      {
        owner: 'owner.xlm',
        delegates: ['delegate.xlm'],
        label: 'not-an-address.xlm',
      },
    ],
    { serverURL: new URL('https://rpc.example') },
    'Test SDF Network ; September 2015',
    'call',
  );

  assert.equal(profile.owner, resolved['owner.xlm']);
  assert.equal(profile.delegates[0], resolved['delegate.xlm']);
  assert.equal(profile.label, 'not-an-address.xlm');
  assert.deepEqual(
    seen.map(({ value }) => value),
    ['owner.xlm', 'delegate.xlm'],
  );
  assert.equal(
    seen.every(({ expected }) => expected === 'soroban'),
    true,
  );
});

test('.xlm values stay literal when the ABI declares a non-address type', async () => {
  const resolvedAddress = stellar.Keypair.random().publicKey();
  const seen = [];
  const spec = {
    getFunc: () => ({
      inputs: [
        {
          name: { toString: () => 'owner' },
          type: addressType,
        },
        {
          name: { toString: () => 'label' },
          type: stringType,
        },
        {
          name: { toString: () => 'alias' },
          type: { type: 'scSpecTypeSymbol' },
        },
      ],
    }),
    nativeToScVal: (value) => value,
  };
  const load = createLoader({
    spec,
    resolveAddress: async (value, options) => {
      seen.push({ value, expected: options.expected });
      return { address: resolvedAddress };
    },
  });
  const { contractArgsToScVals } = load('src/exports/core/contractArgs');

  const result = await contractArgsToScVals(
    'CFAKE',
    'set_profile',
    ['owner.xlm', 'alice.xlm', 'alice.xlm'],
    { serverURL: new URL('https://rpc.example') },
    'Test SDF Network ; September 2015',
    'call',
  );

  assert.equal(result[0], resolvedAddress);
  assert.equal(result[1], 'alice.xlm');
  assert.equal(result[2], 'alice.xlm');
  assert.deepEqual(seen, [{ value: 'owner.xlm', expected: 'soroban' }]);
});

test('pre-encoded ScVals still bypass ABI and address resolution', async () => {
  let resolutions = 0;
  const value = stellar.xdr.ScVal.scvBool(true);
  const load = createLoader({
    // Reaching the spec would fail because this deliberately has no getFunc.
    spec: {},
    resolveAddress: async () => {
      resolutions += 1;
      return {};
    },
  });
  const { contractArgsToScVals } = load('src/exports/core/contractArgs');
  const result = await contractArgsToScVals(
    'CFAKE',
    'noop',
    [value],
    { serverURL: new URL('https://rpc.example') },
    'Test SDF Network ; September 2015',
    'call',
  );

  assert.equal(result[0], value);
  assert.equal(resolutions, 0);
});
