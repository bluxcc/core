const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = resolve(__dirname, '../src/exports/core/readContract.ts');

function loadReadContract({ configured = true, readContracts }) {
  const module = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(source, 'utf8'), {
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
      require: (name) => {
        if (name === '../utils') {
          return { checkConfigCreated: () => configured };
        }
        if (name === './readContracts') {
          return { readContracts };
        }
        throw new Error(`Unexpected import: ${name}`);
      },
    },
    { filename: source },
  );

  return module.exports.readContract;
}

test('readContract accepts one call and returns one raw response and value', async () => {
  const call = {
    address: 'profile.xlm',
    fn: 'display_name',
    args: ['alice.xlm'],
  };
  const options = { network: 'Test SDF Network ; September 2015' };
  const raw = { id: 'simulation' };
  let receivedCalls;
  let receivedOptions;
  const readContract = loadReadContract({
    readContracts: async (calls, readOptions) => {
      receivedCalls = calls;
      receivedOptions = readOptions;
      return { raws: [raw], values: ['alice.xlm'] };
    },
  });

  const result = await readContract(call, options);

  assert.equal(receivedCalls.length, 1);
  assert.equal(receivedCalls[0], call);
  assert.equal(receivedOptions, options);
  assert.equal(Array.isArray(result), false);
  assert.equal(result.raw, raw);
  assert.equal(result.value, 'alice.xlm');
  assert.equal(Array.isArray(result.value), false);
});

test('readContract reports its own validation errors before delegating', async () => {
  let delegated = false;
  const readContract = loadReadContract({
    readContracts: async () => {
      delegated = true;
      return { raws: [], values: [] };
    },
  });

  await assert.rejects(
    readContract({ address: '', fn: 'read', args: [] }),
    /BLUX: call\.address is required/,
  );
  await assert.rejects(
    readContract({ address: 'CFAKE', fn: ' ', args: [] }),
    /BLUX: call\.fn is required/,
  );
  assert.equal(delegated, false);
});

test('readContract requires createConfig', async () => {
  const readContract = loadReadContract({
    configured: false,
    readContracts: async () => ({ raws: [], values: [] }),
  });

  await assert.rejects(
    readContract({ address: 'CFAKE', fn: 'read', args: [] }),
    /BLUX: readContract must be called after createConfig/,
  );
});
