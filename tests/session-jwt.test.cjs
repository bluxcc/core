const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = resolve(__dirname, '..');
const JWT_KEY = '__BLUX__JWT_STORE';
const SESSION_KEY = '__BLUX__RECENT_LOGIN_CONFIG';

function memoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };
}

// Run the production store, login drivers, and API client. Only browser storage,
// HTTP responses, and unrelated wallet/UI services are replaced. A new loader
// with the same storage models a full page reload, not just a state reset.
function setup({
  storage = memoryStorage(),
  method = 'email',
  appId = 'app-one',
  browser = true,
} = {}) {
  const requests = [];
  let response = async () => ({
    status: 200,
    result: {
      public_key: 'GUSER',
      auth_method: method,
      auth_value: `${method}-user`,
    },
  });
  const mocks = {
    'src/exports/exportedStore': { syncExportedStore() {} },
    'src/utils/helpers': {
      fetcher: async (url, options) => {
        const request = { url, options };
        requests.push(request);
        return response(request);
      },
      timeout: async () => {},
      canonicalWalletName: (name) => name,
      getWalletNetwork: async () => 'wallet-network',
    },
    'src/utils/socialLogin': { canonicalSocialName: (name) => name },
    'src/utils/passkey': {},
    'src/wallets': {},
    'src/stellar/processes/connectWalletProcess': { default() {} },
    'src/stellar/handleSignMessage': { default() {} },
    'src/stellar/handleSignAuthEntry': { default() {} },
    'src/stellar/handleTransactionSigning': { default() {} },
    'src/stellar/getTransactionDetails': { default() {} },
    'src/utils/preloadImages': { preloadLogos() {} },
    'src/utils/preloadAssetMeta': { preloadAssetMeta() {} },
    'src/exports': {},
    'src/exports/createConfig': {},
  };
  const overrides = new Map(
    Object.entries(mocks).map(([name, value]) => [
      resolve(root, name),
      { __esModule: true, ...value },
    ]),
  );
  const cache = new Map();
  function load(name) {
    const base = resolve(root, name);
    if (overrides.has(base)) return overrides.get(base);
    if (base.endsWith('.css')) return {};
    const file = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      resolve(base, 'index.ts'),
    ].find(
      (candidate) => /\.(ts|tsx)$/.test(candidate) && existsSync(candidate),
    );
    assert.ok(file, `Missing module ${name}`);
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
        require: (dependency) =>
          dependency.startsWith('.')
            ? load(resolve(dirname(file), dependency))
            : require(dependency),
        console,
        setTimeout,
        clearTimeout,
        URL,
        URLSearchParams,
        ...(browser ? { window: {}, localStorage: storage } : {}),
      },
      { filename: file },
    );
    return module.exports;
  }
  const store = load('src/store');
  store.setState((state) => ({
    ...state,
    config: {
      ...state.config,
      appId,
      loginMethods: ['wallet', 'email', 'sms', 'passkey'],
    },
    apiResponse: { isValid: true, terms: '', privacyPolicy: '' },
    authState: { isReady: true, isAuthenticated: false },
    stellar: { activeNetwork: 'configured-network' },
  }));
  const session = load('src/utils/sessionJwt');
  const login = load('src/stellar/processes/continueLoginProcess');
  return {
    storage,
    store,
    session,
    login,
    load,
    requests,
    respond(fn) {
      response = fn;
    },
    async authenticate(jwt = 'session-token') {
      await load('src/stellar/processes/hydrateUserFromJwt').hydrateUserFromJwt(
        jwt,
        method,
        `${method}-user`,
      );
      login.completeLoginProcess();
    },
    startup() {
      load('src/index');
    },
  };
}

const nextTurn = () => new Promise((resolve) => setImmediate(resolve));
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

for (const method of [
  'email',
  'sms',
  'google',
  'apple',
  'twitter',
  'passkey',
  'telegram',
]) {
  test(`${method} login persists and automatically restores after a page reload`, async () => {
    const first = setup({ method });
    await first.authenticate();
    assert.equal(first.storage.getItem(JWT_KEY), 'session-token');

    const reloaded = setup({ storage: first.storage, method });
    reloaded.startup();
    await nextTurn();
    assert.equal(reloaded.store.getState().authState.isAuthenticated, true);
    assert.equal(reloaded.session.getJwt(), 'session-token');
    assert.equal(reloaded.store.getState().user.authMethod, method);
    assert.equal(
      reloaded.store.getState().user.walletPassphrase,
      'configured-network',
    );
    assert.equal(reloaded.store.getState().modal.isOpen, false);
    assert.equal(reloaded.requests.length, 1);
    assert.equal(
      reloaded.requests[0].options.headers.Authorization,
      'Bearer session-token',
    );
  });
}

test('terms acceptance is required before saving the session', async () => {
  const app = setup();
  app.store
    .getState()
    .setApiResponse({ isValid: true, terms: 'terms', privacyPolicy: '' });
  await app
    .load('src/stellar/processes/hydrateUserFromJwt')
    .hydrateUserFromJwt('pending-token', 'email');
  app.login.default();
  assert.equal(app.session.getJwt(), undefined);
  assert.equal(app.storage.getItem(JWT_KEY), null);
  assert.equal(app.storage.getItem(SESSION_KEY), null);
  assert.equal(app.store.getState().modal.route, 'ACCEPT_TERMS_AND_PRIVACY');
  app.login.completeLoginProcess();
  assert.equal(app.storage.getItem(JWT_KEY), 'pending-token');
});

test('rejecting terms removes both the pending and previous saved session', async () => {
  const app = setup();
  await app.authenticate();
  await app
    .load('src/stellar/processes/hydrateUserFromJwt')
    .hydrateUserFromJwt('pending-token', 'email');
  app.login.rejectLoginProcess();
  assert.equal(app.session.getJwt(), undefined);
  assert.equal(app.storage.getItem(JWT_KEY), null);
  assert.equal(app.storage.getItem(SESSION_KEY), null);
});

for (const action of ['store', 'public']) {
  test(`${action} logout clears storage and prevents re-login after reload`, async () => {
    const app = setup();
    await app.authenticate();
    if (action === 'store') app.store.getState().logoutAction();
    else app.load('src/exports/blux').blux.logout();
    assert.equal(app.session.getJwt(), undefined);
    assert.equal(app.storage.getItem(JWT_KEY), null);
    assert.equal(app.storage.getItem(SESSION_KEY), null);
    const reloaded = setup({ storage: app.storage });
    await assert.rejects(
      reloaded.load('src/exports/loginMethods')._login(true),
      /No saved session/,
    );
    assert.equal(reloaded.requests.length, 0);
  });
}

for (const status of [401, 403, 404]) {
  test(`API status ${status} rejects and forgets the saved session`, async () => {
    const first = setup();
    await first.authenticate();
    const app = setup({ storage: first.storage });
    app.respond(async () => ({ status }));
    const restored = await app
      .load('src/utils/checkRecentLogins')
      .checkRecentLogins();
    assert.equal(restored, false);
    assert.equal(app.session.getJwt(), undefined);
    assert.equal(app.store.getState().user, undefined);
    assert.equal(app.storage.getItem(JWT_KEY), null);
    assert.equal(app.storage.getItem(SESSION_KEY), null);
  });
}

for (const failure of ['network', 429, 500]) {
  test(`temporary ${failure} failure preserves credentials for the next reload`, async () => {
    const first = setup();
    await first.authenticate();
    const app = setup({ storage: first.storage });
    app.respond(async () => {
      if (failure === 'network') throw new Error('offline');
      return { status: failure };
    });
    assert.equal(
      await app.load('src/utils/checkRecentLogins').checkRecentLogins(),
      false,
    );
    assert.equal(app.session.getJwt(), undefined);
    assert.equal(app.storage.getItem(JWT_KEY), 'session-token');
    const retry = setup({ storage: app.storage });
    assert.equal(
      await retry.load('src/utils/checkRecentLogins').checkRecentLogins(),
      true,
    );
  });
}

test('a saved session remains usable beyond the old 40-minute reconnect window', async () => {
  const app = setup();
  await app.authenticate();
  const record = JSON.parse(app.storage.getItem(SESSION_KEY));
  record.timestamp = Date.now() - 4 * 60 * 60 * 1000;
  app.storage.setItem(SESSION_KEY, JSON.stringify(record));
  const reloaded = setup({ storage: app.storage });
  assert.equal(
    await reloaded.load('src/utils/checkRecentLogins').checkRecentLogins(),
    true,
  );
});

test('sessions from a different appId on the same origin are not restored', async () => {
  const app = setup();
  await app.authenticate();
  const other = setup({ storage: app.storage, appId: 'app-two' });
  assert.equal(
    await other.load('src/utils/checkRecentLogins').checkRecentLogins(),
    false,
  );
  assert.equal(other.requests.length, 0);
  assert.equal(other.session.getJwt(), undefined);
});

test('logout during API validation cancels the pending restore', async () => {
  const first = setup();
  await first.authenticate();
  const app = setup({ storage: first.storage });
  const pending = deferred();
  app.respond(() => pending.promise);
  const restore = app.load('src/utils/checkRecentLogins').checkRecentLogins();
  assert.equal(app.session.getJwt(), undefined);
  app.store.getState().logoutAction();
  pending.resolve({
    status: 200,
    result: {
      public_key: 'GUSER',
      auth_method: 'email',
      auth_value: 'email-user',
    },
  });
  assert.equal(await restore, false);
  assert.equal(app.session.getJwt(), undefined);
  assert.equal(app.storage.getItem(JWT_KEY), null);
});

test('logout from an auth subscriber does not save the restored session again', async () => {
  const first = setup({ method: 'wallet' });
  await first.authenticate();
  const app = setup({ storage: first.storage, method: 'wallet' });
  app.store
    .getState()
    .setWallets([{ name: 'wallet-user', connect: async () => 'GUSER' }]);
  const unsubscribe = app.session.subscribeSession(() => {
    if (app.session.getJwt()) app.store.getState().logoutAction();
  });
  assert.equal(
    await app.load('src/utils/checkRecentLogins').checkRecentLogins(),
    false,
  );
  unsubscribe();
  assert.equal(app.store.getState().authState.isAuthenticated, false);
  assert.equal(app.storage.getItem(JWT_KEY), null);
  assert.equal(app.storage.getItem(SESSION_KEY), null);
});

test('logout from an auth subscriber also cancels a freshly accepted login', async () => {
  const app = setup();
  const unsubscribe = app.session.subscribeSession(() => {
    if (app.session.getJwt()) app.store.getState().logoutAction();
  });
  await app.authenticate();
  unsubscribe();
  assert.equal(app.store.getState().authState.isAuthenticated, false);
  assert.equal(app.storage.getItem(JWT_KEY), null);
  assert.equal(app.storage.getItem(SESSION_KEY), null);
});

test('interactive login waits for startup restoration instead of opening onboarding', async () => {
  const first = setup();
  await first.authenticate();
  const app = setup({ storage: first.storage });
  const pending = deferred();
  app.respond(() => pending.promise);
  const driver = app.load('src/exports/loginMethods');
  const silent = driver._login(true);
  const interactive = driver.login();
  await nextTurn();
  assert.equal(app.store.getState().modal.isOpen, false);
  pending.resolve({
    status: 200,
    result: {
      public_key: 'GUSER',
      auth_method: 'email',
      auth_value: 'email-user',
    },
  });
  assert.equal((await silent).address, 'GUSER');
  assert.equal((await interactive).address, 'GUSER');
  assert.equal(app.store.getState().login, undefined);
});

test('parallel restore calls share validation and emit login once', async () => {
  const first = setup();
  await first.authenticate();
  const app = setup({ storage: first.storage });
  let events = 0;
  app.store.getState().emitter.on('blux:logged_in', () => {
    events++;
  });
  const { checkRecentLogins } = app.load('src/utils/checkRecentLogins');
  const results = await Promise.all([checkRecentLogins(), checkRecentLogins()]);
  assert.deepEqual(results, [true, true]);
  assert.equal(app.requests.length, 1);
  assert.equal(events, 1);
});

test('a new login supersedes an API restore still in flight', async () => {
  const first = setup();
  await first.authenticate();
  const app = setup({ storage: first.storage });
  const pending = deferred();
  app.respond(() => pending.promise);
  const restore = app.load('src/utils/checkRecentLogins').checkRecentLogins();
  app.store.setState((state) => ({
    ...state,
    auth: { JWT: 'new-token', isAuthenticated: true },
    user: {
      address: 'GNEW',
      authMethod: 'email',
      authValue: 'new-user',
      walletPassphrase: '',
    },
    authState: { ...state.authState, isAuthenticated: true },
  }));
  app
    .load('src/utils/checkRecentLogins')
    .setRecentLoginConfig('email', 'new-user');
  pending.resolve({
    status: 200,
    result: {
      public_key: 'GOLD',
      auth_method: 'email',
      auth_value: 'old-user',
    },
  });
  assert.equal(await restore, false);
  assert.equal(app.session.getJwt(), 'new-token');
  assert.equal(app.store.getState().user.address, 'GNEW');
  assert.equal(app.storage.getItem(JWT_KEY), 'new-token');
});

test('interactive login opens onboarding when no session can be restored', async () => {
  const app = setup();
  const driver = app.load('src/exports/loginMethods');
  const silent = driver._login(true);
  const silentFailure = assert.rejects(silent, /No saved session/);
  const interactive = driver.login();
  const interactiveFailure = assert.rejects(interactive, /cancelled/);
  await nextTurn();
  await silentFailure;
  assert.equal(app.store.getState().modal.isOpen, true);
  app.login.rejectLoginProcess('Login cancelled');
  await interactiveFailure;
});

test('malformed storage is discarded without breaking startup', async () => {
  const app = setup();
  app.storage.setItem(SESSION_KEY, '{broken');
  app.storage.setItem(JWT_KEY, 'old-token');
  assert.equal(
    await app.load('src/utils/checkRecentLogins').checkRecentLogins(),
    false,
  );
  assert.equal(app.storage.getItem(JWT_KEY), null);
});

test('blocked localStorage does not prevent a fresh login or logout', async () => {
  const blocked = () => {
    throw new Error('storage denied');
  };
  const app = setup({
    storage: { getItem: blocked, setItem: blocked, removeItem: blocked },
  });
  await app.authenticate();
  assert.equal(app.session.getJwt(), 'session-token');
  assert.doesNotThrow(() => app.store.getState().logoutAction());
  assert.equal(app.session.getJwt(), undefined);
});

test('SSR can read hooks and skip restoration without browser storage', async () => {
  const app = setup({ browser: false });
  assert.equal(app.session.getJwt(), undefined);
  assert.equal(
    await app.load('src/utils/checkRecentLogins').checkRecentLogins(),
    false,
  );
});

for (const address of ['GUSER', 'GOTHER']) {
  test(`wallet reload checks the connected address ${address} against the JWT`, async () => {
    const first = setup({ method: 'wallet' });
    await first.authenticate();
    const app = setup({ storage: first.storage, method: 'wallet' });
    app.store
      .getState()
      .setWallets([{ name: 'wallet-user', connect: async () => address }]);
    assert.equal(
      await app.load('src/utils/checkRecentLogins').checkRecentLogins(),
      address === 'GUSER',
    );
    assert.equal(
      app.session.getJwt(),
      address === 'GUSER' ? 'session-token' : undefined,
    );
  });
}

test('legacy wallet reconnect records still work without a stored JWT', async () => {
  const app = setup({ method: 'wallet' });
  app.storage.setItem(
    SESSION_KEY,
    JSON.stringify({
      authMethod: 'wallet',
      authValue: 'wallet-user',
      timestamp: Date.now(),
    }),
  );
  app.store
    .getState()
    .setWallets([{ name: 'wallet-user', connect: async () => 'GUSER' }]);
  assert.equal(
    await app.load('src/utils/checkRecentLogins').checkRecentLogins(),
    true,
  );
  assert.equal(app.session.getJwt(), undefined);
  assert.equal(app.requests.length, 0);
});
