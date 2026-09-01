const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = resolve(__dirname, '..');

// Run the real TS/TSX modules with only the browser and application services
// replaced. No extra test runtime, network requests, or OAuth credentials.
function createLoader(overrides = {}, globals = {}) {
  const cache = new Map();
  const mocks = new Map(
    Object.entries(overrides).map(([path, value]) => [
      resolve(root, path),
      { __esModule: true, ...value },
    ]),
  );
  const load = (path) => {
    const base = resolve(root, path);
    if (mocks.has(base)) return mocks.get(base);
    const file = [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      resolve(base, 'index.tsx'),
    ].find(
      (candidate) => /\.(ts|tsx)$/.test(candidate) && existsSync(candidate),
    );
    assert.ok(file, `Missing test module: ${path}`);
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    });
    vm.runInNewContext(
      outputText,
      {
        module,
        exports: module.exports,
        require: (name) =>
          name.startsWith('.')
            ? load(resolve(dirname(file), name))
            : require(name),
        URL,
        URLSearchParams,
        ...globals,
      },
      { filename: file },
    );
    return module.exports;
  };
  return load;
}

const validatedApp = (socials, isValid = true) => ({
  isValid,
  socials,
  socialsConfig: [],
  message: '',
  terms: '',
  privacyPolicy: '',
});

function setupFlow({ blocked = false } = {}) {
  const listeners = new Set();
  const intervals = new Set();
  const timeouts = new Set();
  const opens = [];
  const popup = {
    closed: false,
    close() {
      this.closed = true;
    },
  };
  const window = {
    location: { origin: 'https://app.example' },
    screenX: 0,
    screenY: 0,
    outerWidth: 1200,
    outerHeight: 900,
    open: (...args) => {
      opens.push(args);
      return blocked ? null : popup;
    },
    addEventListener: (event, callback) => {
      assert.equal(event, 'message');
      listeners.add(callback);
    },
    removeEventListener: (_, callback) => listeners.delete(callback),
  };
  const load = createLoader(
    {},
    {
      window,
      setInterval: (callback) => {
        intervals.add(callback);
        return callback;
      },
      clearInterval: (callback) => intervals.delete(callback),
      setTimeout: (callback) => {
        timeouts.add(callback);
        return callback;
      },
      clearTimeout: (callback) => timeouts.delete(callback),
    },
  );
  const api = load('src/utils/socialLogin');
  const origin = new URL(load('src/constants/consts').BLUX_API).origin;
  return {
    api,
    opens,
    popup,
    listeners,
    intervals,
    timeouts,
    origin,
    message: (data, eventOrigin = origin) => {
      for (const callback of listeners) {
        callback({ origin: eventOrigin, source: popup, data });
      }
    },
  };
}

test('Apple is recognized alongside Google with normalized configuration', () => {
  const api = createLoader()('src/utils/socialLogin');
  assert.equal(api.isSocialProvider(' Apple '), true);
  assert.equal(api.isSocialProvider('google'), true);
  assert.equal(api.SOCIAL_PROVIDERS.apple.displayName, 'Apple');
  assert.deepEqual(
    Array.from(
      api.getEnabledSocials(
        ['email', ' Apple ', 'google', 'APPLE', 'wallet', 'passkey'],
        validatedApp(['APPLE', 'google']),
      ),
    ),
    ['apple', 'google'],
  );
});

test('Apple requires both developer opt-in and backend enablement', () => {
  const api = createLoader()('src/utils/socialLogin');
  assert.equal(api.getEnabledSocials(['apple']).length, 0);
  assert.equal(
    api.getEnabledSocials(['apple'], validatedApp(['apple'], false)).length,
    0,
  );
  assert.equal(
    api.getEnabledSocials(['apple'], validatedApp(['google'])).length,
    0,
  );
  assert.equal(
    api.getEnabledSocials(['email'], validatedApp(['apple'])).length,
    0,
  );
  assert.deepEqual(
    Array.from(
      api.getEnabledSocials(['apple', 'google'], validatedApp(['google'])),
    ),
    ['google'],
  );
});

test('Apple popup uses the Blux-hosted OAuth endpoint and encodes the app ID', () => {
  const flow = setupFlow();
  const session = flow.api.beginSocialLogin('apple', 'app & id');
  const [url, target, features] = flow.opens[0];
  const parsed = new URL(url);
  assert.equal(parsed.origin, flow.origin);
  assert.equal(parsed.pathname, '/auth/social/apple/start');
  assert.equal(parsed.searchParams.get('app_id'), 'app & id');
  assert.equal(parsed.searchParams.get('origin'), 'https://app.example');
  assert.equal(target, 'bluxcc-social-login');
  assert.match(features, /popup=yes/);
  assert.equal(session.provider, 'apple');
  assert.equal(session.popup, flow.popup);
});

test('Apple success accepts only the expected callback origin and message type', async () => {
  const flow = setupFlow();
  const pending = flow.api.awaitSocialLogin(
    flow.api.beginSocialLogin('apple', 'app'),
  );
  const success = {
    source: 'blux',
    type: 'social-auth',
    status: 'success',
    jwt: 'test-jwt',
  };
  flow.message(success, 'https://untrusted.example');
  flow.message({ ...success, type: 'unrelated' });
  assert.equal(flow.popup.closed, false);
  assert.equal(flow.listeners.size, 1);
  flow.message(success);
  assert.equal(await pending, 'test-jwt');
  assert.equal(flow.popup.closed, true);
  assert.equal(flow.listeners.size, 0);
  assert.equal(flow.intervals.size, 0);
});

test('Apple callback errors use the existing retry flow', async () => {
  const flow = setupFlow();
  const pending = flow.api.awaitSocialLogin(
    flow.api.beginSocialLogin('apple', 'app'),
  );
  const rejected = assert.rejects(pending, /Access denied/);
  flow.message({
    source: 'blux',
    type: 'social-auth',
    status: 'error',
    error: 'Access denied',
  });
  await rejected;
  assert.equal(flow.listeners.size, 0);
  assert.equal(flow.popup.closed, true);
});

test('blocked popups and missing app IDs reject without hanging', async () => {
  const blocked = setupFlow({ blocked: true });
  await assert.rejects(
    blocked.api.awaitSocialLogin(blocked.api.beginSocialLogin('apple', 'app')),
    /Popup was blocked/,
  );
  const missing = setupFlow();
  await assert.rejects(
    missing.api.awaitSocialLogin(missing.api.beginSocialLogin('apple', '')),
    /not fully configured/,
  );
  assert.equal(missing.opens.length, 0);
});

test('cancelling Apple login closes the popup and cleans up the waiter', async () => {
  const flow = setupFlow();
  const pending = flow.api.awaitSocialLogin(
    flow.api.beginSocialLogin('apple', 'app'),
  );
  const rejected = assert.rejects(pending, /login window was closed/);
  flow.api.cancelActiveSocialSession();
  assert.equal(flow.api.getActiveSocialSession(), null);
  for (const callback of flow.intervals) callback();
  for (const callback of flow.timeouts) callback();
  await rejected;
  assert.equal(flow.listeners.size, 0);
  assert.equal(flow.intervals.size, 0);
  assert.equal(flow.timeouts.size, 0);
});

function uiLoader({
  dark = false,
  socials = ['apple', 'google'],
  methods = ['apple', 'google'],
  showAllWallets = false,
  provider = 'apple',
} = {}) {
  const background = dark ? '#000000' : '#ffffff';
  const store = {
    config: {
      appId: 'test-app',
      loginMethods: methods,
      appearance: {
        background,
        textColor: dark ? '#ffffff' : '#000000',
        logo: '',
        borderWidth: '1px',
      },
    },
    apiResponse: validatedApp(socials),
    wallets: [],
    showAllWallets,
    user: { authMethod: provider },
  };
  return createLoader({
    'src/store': { useAppStore: (selector) => selector(store) },
    'src/utils/helpers': {
      getContrastColor: (bg) => (bg === '#ffffff' ? '#000000' : '#FFFFFF'),
      isBackgroundDark: () => dark,
      capitalizeFirstLetter: (text) => text[0].toUpperCase() + text.slice(1),
    },
    'src/hooks/useLang': {
      useLang:
        () =>
        (key, vars = {}) =>
          ({
            continueWith: `Continue with ${vars.provider}`,
            waitingFor: `Waiting for ${vars.walletName}`,
            socialPopupHelp: `Continue in the ${vars.provider} window`,
            telegramWidgetHelp:
              'Tap the Telegram button below to finish signing in',
            otherSocials: 'Other socials',
            otherSocialsHelp: 'Choose an account to continue',
          })[key] || key,
    },
    'src/utils/api': {},
    'src/utils/initializeWalletConnect': {},
    'src/stellar/processes/connectWalletProcess': {},
    'src/stellar/processes/continueLoginProcess': {},
    'src/utils/walletLogos': {},
    // Keep the real provider icons and page rendering; isolate shared layout
    // components from their unrelated store and wallet dependencies.
    'src/components/CardItem': {
      default: ({ startIcon, label }) =>
        React.createElement('button', null, startIcon, label),
    },
    'src/components/Button': {
      default: ({ children }) => React.createElement('button', null, children),
    },
    'src/components/Divider': { default: () => null },
    'src/components/CDNImage': {
      default: ({ name }) => React.createElement('img', { src: name }),
    },
  });
}

for (const dark of [false, true]) {
  test(`Apple renders inline in the ${dark ? 'dark' : 'light'} login picker and status screen`, () => {
    const load = uiLoader({ dark, methods: ['apple', 'google', ' APPLE '] });
    const picker = renderToStaticMarkup(
      React.createElement(load('src/pages/Onboarding').default),
    );
    assert.equal((picker.match(/Continue with Apple/g) || []).length, 1);
    assert.match(picker, /Other socials/);
    assert.doesNotMatch(picker, /Continue with Google/);
    assert.match(picker, new RegExp(`fill="${dark ? '#FFFFFF' : '#000000'}"`));
    assert.doesNotMatch(picker, /apple\.svg/);
    const others = renderToStaticMarkup(
      React.createElement(
        load('src/pages/Onboarding/Socials/OtherSocials').default,
      ),
    );
    assert.match(others, /Continue with Google/);
    assert.doesNotMatch(others, /Continue with Apple/);
    const status = renderToStaticMarkup(
      React.createElement(load('src/pages/Onboarding/Socials').default),
    );
    assert.match(status, /Waiting for Apple/);
    assert.match(status, /Continue in the Apple window/);
    assert.match(status, /<svg/);
  });
}

test('picker hides Apple when backend-disabled or browsing all wallets', () => {
  for (const options of [{ socials: ['google'] }, { showAllWallets: true }]) {
    const load = uiLoader(options);
    const html = renderToStaticMarkup(
      React.createElement(load('src/pages/Onboarding').default),
    );
    assert.doesNotMatch(html, /Continue with Apple/);
  }
});

for (const [provider, displayName, brandColor] of [
  ['discord', 'Discord', '#5865F2'],
  ['telegram', 'Telegram', '#229ED9'],
  ['meta', 'Meta', '#0866FF'],
  ['github', 'GitHub', '#181717'],
  ['farcaster', 'Farcaster', '#855DCD'],
  ['tiktok', 'TikTok', '#25F4EE'],
  ['linkedin', 'LinkedIn', '#0A66C2'],
  ['whatsapp', 'WhatsApp', '#25D366'],
  ['twitch', 'Twitch', '#9146FF'],
  ['kick', 'Kick', '#53FC18'],
  ['spotify', 'Spotify', '#1DB954'],
  ['instagram', 'Instagram', '#E4405F'],
]) {
  test(`${displayName} requires opt-in and backend enablement and deduplicates normalized names`, () => {
    const api = createLoader()('src/utils/socialLogin');
    assert.equal(api.isSocialProvider(` ${provider.toUpperCase()} `), true);
    assert.equal(api.SOCIAL_PROVIDERS[provider].displayName, displayName);
    assert.equal(api.getEnabledSocials([provider]).length, 0);
    assert.equal(
      api.getEnabledSocials([provider], validatedApp([provider], false)).length,
      0,
    );
    assert.equal(
      api.getEnabledSocials([provider], validatedApp(['google'])).length,
      0,
    );
    assert.equal(
      api.getEnabledSocials(['email'], validatedApp([provider])).length,
      0,
    );
    assert.deepEqual(
      Array.from(
        api.getEnabledSocials(
          [
            'wallet',
            ` ${provider.toUpperCase()} `,
            'google',
            provider,
            'passkey',
          ],
          validatedApp([provider.toUpperCase(), 'google']),
        ),
      ),
      [provider, 'google'],
    );
  });

  test(`${displayName} opens its own Blux endpoint and completes the popup handoff`, async () => {
    const flow = setupFlow();
    const session = flow.api.beginSocialLogin(provider, 'app & id');
    assert.equal(session.provider, provider);
    const url = new URL(flow.opens[0][0]);
    assert.equal(url.origin, flow.origin);
    assert.equal(url.pathname, `/auth/social/${provider}/start`);
    assert.equal(url.searchParams.get('app_id'), 'app & id');
    assert.equal(url.searchParams.get('origin'), 'https://app.example');
    const pending = flow.api.awaitSocialLogin(session);
    const success = {
      source: 'blux',
      type: 'social-auth',
      status: 'success',
      jwt: `${provider}-test-jwt`,
    };
    flow.message(success, 'https://untrusted.example');
    assert.equal(flow.popup.closed, false);
    flow.message(success);
    assert.equal(await pending, `${provider}-test-jwt`);
    assert.equal(flow.popup.closed, true);
    assert.equal(flow.listeners.size, 0);
    assert.equal(flow.intervals.size, 0);
  });

  test(`${displayName} surfaces provider errors and blocked popups`, async () => {
    const flow = setupFlow();
    const rejected = assert.rejects(
      flow.api.awaitSocialLogin(flow.api.beginSocialLogin(provider, 'app')),
      /User rejected/,
    );
    flow.message({
      source: 'blux',
      type: 'social-auth',
      status: 'error',
      error: 'User rejected',
    });
    await rejected;
    assert.equal(flow.listeners.size, 0);
    const blocked = setupFlow({ blocked: true });
    await assert.rejects(
      blocked.api.awaitSocialLogin(
        blocked.api.beginSocialLogin(provider, 'app'),
      ),
      /Popup was blocked/,
    );
  });

  test(`${displayName} cancellation clears the session and callback listener`, async () => {
    const flow = setupFlow();
    const rejected = assert.rejects(
      flow.api.awaitSocialLogin(flow.api.beginSocialLogin(provider, 'app')),
      /login window was closed/,
    );
    flow.api.cancelActiveSocialSession();
    for (const callback of flow.intervals) callback();
    for (const callback of flow.timeouts) callback();
    await rejected;
    assert.equal(flow.api.getActiveSocialSession(), null);
    assert.equal(flow.listeners.size, 0);
  });

  for (const dark of [false, true]) {
    test(`${displayName} renders its bundled icon and labels in the ${dark ? 'dark' : 'light'} picker and status screen`, () => {
      const load = uiLoader({
        dark,
        provider,
        socials: [provider],
        methods: [provider, ` ${provider.toUpperCase()} `],
      });
      const picker = renderToStaticMarkup(
        React.createElement(load('src/pages/Onboarding').default),
      );
      assert.equal(
        (picker.match(new RegExp(`Continue with ${displayName}`, 'g')) || [])
          .length,
        1,
      );
      const expectedColor =
        provider === 'github' ? (dark ? '#FFFFFF' : '#000000') : brandColor;
      assert.match(picker, new RegExp(`fill="${expectedColor}"`));
      assert.doesNotMatch(picker, /<img/);
      const status = renderToStaticMarkup(
        React.createElement(load('src/pages/Onboarding/Socials').default),
      );
      assert.match(status, new RegExp(`Waiting for ${displayName}`));
      assert.match(
        status,
        provider === 'telegram'
          ? /Tap the Telegram button below to finish signing in/
          : new RegExp(`Continue in the ${displayName} window`),
      );
      assert.match(status, new RegExp(`fill="${expectedColor}"`));
    });
  }

  test(`${displayName} is hidden when disabled or browsing wallets`, () => {
    for (const options of [{ socials: ['google'] }, { showAllWallets: true }]) {
      const load = uiLoader({
        provider,
        methods: [provider],
        socials: [provider],
        ...options,
      });
      const html = renderToStaticMarkup(
        React.createElement(load('src/pages/Onboarding').default),
      );
      assert.doesNotMatch(html, new RegExp(`Continue with ${displayName}`));
    }
  });
}

test('all social providers retain the configured display order', () => {
  const methods = [
    'instagram',
    'spotify',
    'kick',
    'twitch',
    'whatsapp',
    'linkedin',
    'tiktok',
    'farcaster',
    'github',
    'telegram',
    'meta',
    'apple',
    'discord',
    'google',
  ];
  const load = uiLoader({ methods, socials: methods });
  const html = renderToStaticMarkup(
    React.createElement(load('src/pages/Onboarding').default),
  );
  assert.deepEqual(
    html.match(
      /Continue with (Instagram|Spotify|Kick|Twitch|WhatsApp|LinkedIn|TikTok|Farcaster|GitHub|Telegram|Meta|Apple|Discord|Google)|Other socials/g,
    ),
    ['Continue with Instagram', 'Other socials'],
  );
  const others = renderToStaticMarkup(
    React.createElement(
      load('src/pages/Onboarding/Socials/OtherSocials').default,
    ),
  );
  assert.deepEqual(
    others.match(
      /Continue with (Instagram|Spotify|Kick|Twitch|WhatsApp|LinkedIn|TikTok|Farcaster|GitHub|Telegram|Meta|Apple|Discord|Google)/g,
    ),
    [
      'Continue with Spotify',
      'Continue with Kick',
      'Continue with Twitch',
      'Continue with WhatsApp',
      'Continue with LinkedIn',
      'Continue with TikTok',
      'Continue with Farcaster',
      'Continue with GitHub',
      'Continue with Telegram',
      'Continue with Meta',
      'Continue with Apple',
      'Continue with Discord',
      'Continue with Google',
    ],
  );
});
