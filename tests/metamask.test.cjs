const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const {
  Account,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} = require('@stellar/stellar-sdk');

const signer = Keypair.random();
const otherSigner = Keypair.random();
const signingMethods = {
  signTransaction: 'signedTxXdr',
  signAuthEntry: 'signedAuthEntry',
  signMessage: 'signedMessage',
};
const options = { address: signer.publicKey(), network: Networks.PUBLIC };

function loadWallet(Adapter, browserWindow = {}) {
  const cache = new Map();
  function load(file) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    });
    vm.runInNewContext(
      outputText,
      {
        module,
        exports: module.exports,
        ...(browserWindow === null ? {} : { window: browserWindow }),
        require: (id) => {
          if (id === '@metamask/connect-stellar') {
            return { MetaMaskStellarAdapter: Adapter };
          }
          return id.startsWith('.')
            ? load(resolve(file, '..', `${id}.ts`))
            : require(id);
        },
      },
      { filename: file },
    );
    return module.exports;
  }
  return load(resolve(__dirname, '../src/wallets/metamask.ts')).metamaskConfig;
}

function setup(overrides = {}, browserWindow = {}) {
  const calls = [];
  const instances = [];
  const state = { address: signer.publicKey(), available: true };
  class Adapter {
    constructor() {
      instances.push(this);
    }
    static async isMetaMaskAvailable() {
      calls.push(['isMetaMaskAvailable']);
      return overrides.isMetaMaskAvailable
        ? overrides.isMetaMaskAvailable()
        : state.available;
    }
  }
  const defaults = {
    requestAccess: () => ({ address: state.address }),
    disconnect: () => ({}),
    getNetwork: () => ({
      network: 'PUBLIC',
      networkPassphrase: Networks.PUBLIC,
    }),
    ...Object.fromEntries(
      Object.entries(signingMethods).map(([method, resultKey]) => [
        method,
        () => ({ [resultKey]: 'signed-result', signerAddress: state.address }),
      ]),
    ),
  };
  for (const [method, fallback] of Object.entries(defaults)) {
    Adapter.prototype[method] = async (...args) => {
      calls.push([method, ...args]);
      return (overrides[method] ?? fallback)(...args);
    };
  }
  return {
    wallet: loadWallet(Adapter, browserWindow),
    calls,
    instances,
    state,
  };
}

const plain = (value) => JSON.parse(JSON.stringify(value));

test('SSR import and availability do not construct a browser adapter', async () => {
  const { wallet, instances, calls } = setup({}, null);
  assert.equal(await wallet.isAvailable(), false);
  await wallet.disconnect();
  await assert.rejects(wallet.connect(), /requires a browser/);
  assert.equal(instances.length, 0);
  assert.deepEqual(calls, []);
});

test('availability uses the official detector without creating a session', async () => {
  const { wallet, calls, instances, state } = setup();
  assert.equal(await wallet.isAvailable(), true);
  state.available = false;
  assert.equal(await wallet.isAvailable(), false);
  assert.equal(instances.length, 0);
  assert.deepEqual(calls, [['isMetaMaskAvailable'], ['isMetaMaskAvailable']]);
  const unavailable = setup({
    isMetaMaskAvailable: () => {
      throw new Error('Discovery failed');
    },
  });
  assert.equal(await unavailable.wallet.isAvailable(), false);
});

test('connect lazily reuses one official adapter and reads its current account', async () => {
  const { wallet, instances, state } = setup();
  assert.equal(instances.length, 0);
  assert.equal(await wallet.connect(), signer.publicKey());
  state.address = otherSigner.publicKey();
  assert.equal(await wallet.connect(), otherSigner.publicKey());
  assert.equal(instances.length, 1);
  assert.equal(wallet.name, 'MetaMask');
  assert.equal(wallet.authenticateWithSignedMessage, true);
});

test('connect rejects invalid accounts and preserves SDK errors', async () => {
  for (const address of ['', '0x1234', 'stellar:pubnet:GABC']) {
    const { wallet } = setup({ requestAccess: () => ({ address }) });
    await assert.rejects(wallet.connect(), /account unavailable/);
  }
  const error = { message: 'User rejected', code: 4001, ext: ['Details'] };
  const { wallet } = setup({ requestAccess: () => ({ address: '', error }) });
  await assert.rejects(wallet.connect(), (caught) => {
    assert.equal(caught.message, error.message);
    assert.equal(caught.code, error.code);
    assert.deepEqual(caught.ext, error.ext);
    return true;
  });
});

test('transaction signing preserves the envelope and returns its Mainnet signature', async () => {
  const transaction = new TransactionBuilder(
    new Account(signer.publicKey(), '0'),
    {
      fee: '100',
      networkPassphrase: Networks.PUBLIC,
    },
  )
    .addOperation(Operation.manageData({ name: 'test', value: 'challenge' }))
    .setTimeout(0)
    .build();
  const { wallet, calls } = setup({
    signTransaction: (xdr, opts) => {
      assert.equal(xdr, transaction.toXDR());
      assert.deepEqual(plain(opts), {
        address: signer.publicKey(),
        networkPassphrase: Networks.PUBLIC,
      });
      const signed = TransactionBuilder.fromXDR(xdr, opts.networkPassphrase);
      signed.sign(signer);
      return { signedTxXdr: signed.toXDR(), signerAddress: signer.publicKey() };
    },
  });
  const xdr = await wallet.signTransaction(transaction.toXDR(), options);
  const signed = TransactionBuilder.fromXDR(xdr, Networks.PUBLIC);
  assert.deepEqual(signed.hash(), transaction.hash());
  assert.equal(
    signer.verify(signed.hash(), signed.signatures[0].signature),
    true,
  );
  assert.deepEqual(
    calls.map(([method]) => method),
    ['requestAccess', 'signTransaction'],
  );
});

test('auth entry signing passes XDR through without double encoding', async () => {
  const { wallet } = setup({
    signAuthEntry: (authEntry, opts) => {
      assert.equal(authEntry, 'unsigned-auth-xdr');
      assert.deepEqual(plain(opts), {
        address: signer.publicKey(),
        networkPassphrase: Networks.PUBLIC,
      });
      return {
        signedAuthEntry: 'signed-auth-xdr',
        signerAddress: signer.publicKey(),
      };
    },
  });
  assert.equal(
    await wallet.signAuthEntry('unsigned-auth-xdr', options),
    'signed-auth-xdr',
  );
});

test('SEP-53 login still works when the API challenge carries a Testnet default', async () => {
  const message = 'Login challenge 🦊';
  const { wallet } = setup({
    signMessage: (input, opts) => {
      assert.equal(input, message);
      assert.deepEqual(plain(opts), {
        address: signer.publicKey(),
        networkPassphrase: Networks.PUBLIC,
      });
      return {
        signedMessage: Buffer.from(signer.signMessage(input)).toString(
          'base64',
        ),
        signerAddress: signer.publicKey(),
      };
    },
  });
  for (const network of [undefined, Networks.TESTNET, Networks.PUBLIC]) {
    const signature = await wallet.signMessage(message, {
      ...options,
      network,
    });
    assert.equal(
      signer.verifyMessage(message, Buffer.from(signature, 'base64')),
      true,
    );
  }
});

test('non-Mainnet transactions and auth entries fail before creating an adapter', async () => {
  const { wallet, calls, instances } = setup();
  for (const network of [
    Networks.TESTNET,
    Networks.FUTURENET,
    Networks.STANDALONE,
    'custom',
  ]) {
    for (const method of ['signTransaction', 'signAuthEntry']) {
      await assert.rejects(
        wallet[method]('xdr', { ...options, network }),
        /only supports Mainnet/,
      );
    }
  }
  assert.deepEqual(calls, []);
  assert.equal(instances.length, 0);
});

for (const [method, resultKey] of Object.entries(signingMethods)) {
  test(`${method} blocks a changed account before asking for a signature`, async () => {
    const { wallet, state, calls } = setup();
    await wallet.connect();
    state.address = otherSigner.publicKey();
    await assert.rejects(
      wallet[method]('input', options),
      /account has changed/,
    );
    assert.equal(
      calls.some(([name]) => name === method),
      false,
    );
  });

  test(`${method} preserves SDK error codes and thrown failures`, async () => {
    const { wallet } = setup({
      [method]: () => ({
        error: { message: 'User rejected signing', code: 4001 },
      }),
    });
    await assert.rejects(
      wallet[method]('input', options),
      (error) =>
        error.message === 'User rejected signing' && error.code === 4001,
    );
    const failure = new Error('Transport failed');
    const thrown = setup({
      [method]: () => {
        throw failure;
      },
    });
    await assert.rejects(
      thrown.wallet[method]('input', options),
      (error) => error === failure,
    );
  });

  test(`${method} rejects missing signatures and wrong signers`, async () => {
    for (const result of [
      null,
      {},
      { [resultKey]: '' },
      { [resultKey]: ' ' },
      { [resultKey]: null },
    ]) {
      const { wallet } = setup({ [method]: () => result });
      await assert.rejects(wallet[method]('input', options), /did not return/);
    }
    const { wallet } = setup({
      [method]: () => ({
        [resultKey]: 'signed',
        signerAddress: otherSigner.publicKey(),
      }),
    });
    await assert.rejects(wallet[method]('input', options), /different signer/);
  });
}

test('network reporting maps the SDK passphrase and propagates connection errors', async () => {
  const { wallet } = setup();
  await wallet.connect();
  assert.deepEqual(plain(await wallet.getNetwork()), {
    network: 'PUBLIC',
    passphrase: Networks.PUBLIC,
  });
  const disconnected = setup({
    getNetwork: () => ({
      network: '',
      networkPassphrase: '',
      error: { message: 'Not connected', code: -3 },
    }),
  });
  await assert.rejects(
    disconnected.wallet.getNetwork(),
    (error) => error.code === -3,
  );
});

test('disconnect revokes the official session and permits reconnecting', async () => {
  const { wallet, calls, instances } = setup();
  await wallet.disconnect();
  assert.equal(instances.length, 0);
  await wallet.connect();
  await wallet.disconnect();
  await wallet.connect();
  assert.deepEqual(
    calls.map(([method]) => method),
    ['requestAccess', 'disconnect', 'requestAccess'],
  );
  assert.equal(instances.length, 1);
  const failed = setup({
    disconnect: () => ({
      error: { message: 'Could not revoke session', code: -1 },
    }),
  });
  await failed.wallet.connect();
  await assert.rejects(failed.wallet.disconnect(), /Could not revoke session/);
});

test('the official standalone adapter bundles without a Wallets Kit runtime dependency', async () => {
  const { rollup } = require('rollup');
  const { nodeResolve } = require('@rollup/plugin-node-resolve');
  const warnings = [];
  const bundle = await rollup({
    input: resolve(__dirname, '../src/wallets/metamask.ts'),
    external: ['@stellar/stellar-sdk'],
    onwarn: (warning) => warnings.push(warning),
    plugins: [
      nodeResolve({
        browser: true,
        extensions: ['.mjs', '.js', '.json', '.ts'],
      }),
      {
        name: 'transpile-test-entry',
        transform(source, id) {
          if (!id.endsWith('.ts')) return null;
          return ts.transpileModule(source, {
            compilerOptions: {
              module: ts.ModuleKind.ESNext,
              target: ts.ScriptTarget.ES2020,
            },
          }).outputText;
        },
      },
    ],
  });
  try {
    const { output } = await bundle.generate({ format: 'cjs' });
    assert.deepEqual(output[0].imports, ['@stellar/stellar-sdk']);
    assert.equal(
      output[0].code.includes('@creit.tech/stellar-wallets-kit'),
      false,
    );
    const module = { exports: {} };
    vm.runInNewContext(output[0].code, {
      module,
      exports: module.exports,
      require,
    });
    assert.equal(await module.exports.metamaskConfig.isAvailable(), false);
    await assert.rejects(
      module.exports.metamaskConfig.connect(),
      /requires a browser/,
    );
    assert.equal(
      warnings.every(
        (warning) =>
          warning.code === 'UNRESOLVED_IMPORT' &&
          warning.exporter === '@creit.tech/stellar-wallets-kit',
      ),
      true,
    );
  } finally {
    await bundle.close();
  }
});
