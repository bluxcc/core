const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const { Networks } = require('@stellar/stellar-sdk');

const source = resolve(__dirname, '../src/utils/configDefaults.ts');
const { outputText } = ts.transpileModule(readFileSync(source, 'utf8'), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
});
const moduleUnderTest = { exports: {} };

vm.runInNewContext(
  outputText,
  {
    module: moduleUnderTest,
    exports: moduleUnderTest.exports,
    require,
  },
  { filename: source },
);

const { resolveConfigDefaults } = moduleUnderTest.exports;

test('defaults appName and an omitted network configuration to Mainnet', () => {
  const result = resolveConfigDefaults({ appId: 'app-id' });

  assert.equal(result.appName, 'App');
  assert.deepEqual(Array.from(result.networks), [Networks.PUBLIC]);
  assert.equal(result.defaultNetwork, Networks.PUBLIC);
});

test('uses a lone defaultNetwork as the only configured network', () => {
  const result = resolveConfigDefaults({
    appId: 'app-id',
    defaultNetwork: Networks.TESTNET,
  });

  assert.deepEqual(Array.from(result.networks), [Networks.TESTNET]);
  assert.equal(result.defaultNetwork, Networks.TESTNET);
});

test('uses the first explicit network when defaultNetwork is omitted', () => {
  const result = resolveConfigDefaults({
    appId: 'app-id',
    appName: 'My App',
    networks: [Networks.TESTNET, Networks.PUBLIC],
  });

  assert.equal(result.appName, 'My App');
  assert.deepEqual(Array.from(result.networks), [
    Networks.TESTNET,
    Networks.PUBLIC,
  ]);
  assert.equal(result.defaultNetwork, Networks.TESTNET);
});

test('treats an empty networks array and blank appName as omitted', () => {
  const result = resolveConfigDefaults({
    appId: 'app-id',
    appName: '   ',
    networks: [],
  });

  assert.equal(result.appName, 'App');
  assert.deepEqual(Array.from(result.networks), [Networks.PUBLIC]);
  assert.equal(result.defaultNetwork, Networks.PUBLIC);
});
