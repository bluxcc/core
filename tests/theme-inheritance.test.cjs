const { test } = require('node:test');
const assert = require('node:assert/strict');
const { existsSync, readFileSync } = require('node:fs');
const { dirname, resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const root = resolve(__dirname, '..');

function createLoader(globals = {}) {
  const cache = new Map();

  const load = (path) => {
    const base = resolve(root, path);
    const file = [base, `${base}.ts`, resolve(base, 'index.ts')].find(
      (candidate) => /\.ts$/.test(candidate) && existsSync(candidate),
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
          name.startsWith('.')
            ? load(resolve(dirname(file), name))
            : require(name),
        console,
        queueMicrotask,
        ...globals,
      },
      { filename: file },
    );

    return module.exports;
  };

  return load;
}

const resolveVars = (value, element) => {
  if (!value) return '';

  let result = String(value);
  for (let pass = 0; pass < 10 && /var\(/.test(result); pass += 1) {
    result = result.replace(
      /var\((--[A-Za-z0-9_-]+)(?:,\s*([^)]*))?\)/g,
      (_, name, fallback = '') => findVariable(element, name) || fallback,
    );
  }

  result = result.replace(
    /calc\(\s*(-?\d+(?:\.\d+)?)px\s*\+\s*(-?\d+(?:\.\d+)?)px\s*\)/g,
    (_, left, right) => `${Number(left) + Number(right)}px`,
  );

  if (/var\(/.test(result) || /definitely-invalid/.test(result)) return '';

  return result.trim();
};

const findVariable = (element, name) => {
  for (let node = element; node; node = node.parentElement) {
    if (node.variables[name] !== undefined) return node.variables[name];
  }

  return '';
};

class FakeElement {
  constructor(document, { variables = {}, computed = {}, selector = '' } = {}) {
    this.ownerDocument = document;
    this.variables = { ...variables };
    this.computed = {
      color: 'rgb(17, 17, 17)',
      fontFamily: 'Host Sans',
      backgroundColor: 'transparent',
      backgroundImage: 'none',
      ...computed,
    };
    this.selector = selector;
    this.parentElement = null;
    this.children = [];
    this.samples = {};
    this.style = {
      cssText: '',
      color: '',
      background: '',
      backgroundColor: '',
      fontFamily: '',
      borderTop: '',
      borderTopLeftRadius: '',
      outline: '',
      marginLeft: '',
      boxShadow: '',
    };
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(
      (child) => child !== this,
    );
    this.parentElement = null;
  }

  setAttribute() {}

  matches(selector) {
    return selector === this.selector;
  }

  closest(selector) {
    for (let node = this; node; node = node.parentElement) {
      if (node.matches(selector)) return node;
    }

    return null;
  }

  querySelector(selector) {
    if (selector.includes('.modal-content')) return this.samples.modal || null;
    if (selector.includes('.form-control')) return this.samples.input || null;
    if (
      selector.includes('input') ||
      selector.includes('textarea') ||
      selector.includes('[role="textbox"]')
    ) {
      return this.samples.input || null;
    }
    if (selector.includes('DialogContent') || selector.includes('dialog')) {
      return this.samples.dialog || null;
    }

    return this.children.find((child) => child.matches(selector)) || null;
  }
}

function createEnvironment(options = {}) {
  const observers = [];
  const mediaListeners = new Set();
  const document = {
    selectors: {},
    createElement: () => new FakeElement(document),
    querySelector(selector) {
      return this.selectors[selector] || null;
    },
  };

  const computedStyle = (element) => {
    const isProbe = element.children.length === 0 && element.style.cssText;
    if (!isProbe) {
      return {
        ...element.computed,
        getPropertyValue: (name) => findVariable(element, name),
      };
    }

    const background = resolveVars(element.style.background, element);
    const border = resolveVars(element.style.borderTop, element).replace(
      /\s+solid$/,
      '',
    );
    const outline = resolveVars(element.style.outline, element).replace(
      /\s+solid$/,
      '',
    );

    return {
      color: resolveVars(element.style.color, element),
      backgroundColor:
        background && !/gradient\(/.test(background) ? background : '',
      backgroundImage: /gradient\(/.test(background) ? background : 'none',
      fontFamily: resolveVars(element.style.fontFamily, element),
      borderTopWidth: border,
      borderTopLeftRadius: resolveVars(
        element.style.borderTopLeftRadius,
        element,
      ),
      outlineWidth: outline,
      marginLeft: resolveVars(element.style.marginLeft, element),
      boxShadow: resolveVars(element.style.boxShadow, element),
      getPropertyValue: (name) => findVariable(element, name),
    };
  };

  class MutationObserver {
    constructor(callback) {
      this.callback = callback;
      this.targets = [];
      observers.push(this);
    }
    observe(target, observerOptions) {
      this.targets.push({ target, observerOptions });
    }
    disconnect() {
      this.targets = [];
    }
  }

  const media = {
    addEventListener: (_, listener) => mediaListeners.add(listener),
    removeEventListener: (_, listener) => mediaListeners.delete(listener),
  };

  document.defaultView = {
    getComputedStyle: computedStyle,
    MutationObserver,
    matchMedia: () => media,
  };

  const html = new FakeElement(document, { selector: 'html' });
  const mount = new FakeElement(document, options);
  html.appendChild(mount);
  document.documentElement = html;
  document.body = mount;

  return {
    document,
    html,
    mount,
    observers,
    triggerMutation: () => observers.forEach((observer) => observer.callback()),
    triggerMedia: () => mediaListeners.forEach((listener) => listener()),
  };
}

const plain = (value) => JSON.parse(JSON.stringify(value));

test('framework adapters expose only their documented semantic variables', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const maps = {
    shadcn: api.getThemeVariableMap({ source: 'shadcn' }),
    radix: api.getThemeVariableMap({ source: 'radix' }),
    daisyui: api.getThemeVariableMap({ source: 'daisyui' }),
    mantine: api.getThemeVariableMap({ source: 'mantine' }),
    joy: api.getThemeVariableMap({ source: 'joy' }),
    heroui: api.getThemeVariableMap({ source: 'heroui' }),
    bootstrap: api.getThemeVariableMap({ source: 'bootstrap' }),
  };

  assert.equal(maps.shadcn.fieldBackground, undefined);
  assert.equal(maps.shadcn.accentColor, '--primary');
  assert.equal(maps.radix.boxShadow, '--shadow-6');
  assert.equal(maps.daisyui.boxShadow, undefined);
  assert.equal(maps.daisyui.borderRadius, '--radius-box');
  assert.equal(maps.mantine.background, '--mantine-color-body');
  assert.equal(maps.joy.background, '--joy-palette-background-popup');
  assert.equal(maps.heroui.background, '--overlay');
  assert.equal(maps.heroui.accentColor, '--accent');
  assert.equal(maps.heroui.logo, undefined);
  assert.equal(maps.bootstrap.outlineWidth, '--bs-focus-ring-width');
});

test('configurable prefixes and Chakra palettes are explicit', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const chakraWithoutPalette = api.getThemeVariableMap({
    source: 'chakra',
  });
  const chakra = api.getThemeVariableMap({
    source: 'chakra',
    prefix: 'sui-',
    colorPalette: 'brand',
  });
  const mui = api.getThemeVariableMap({ source: 'mui', prefix: '' });
  const bootstrap = api.getThemeVariableMap({
    source: 'bootstrap',
    prefix: '--custom-',
  });

  assert.equal(chakraWithoutPalette.accentColor, undefined);
  assert.equal(chakra.accentColor, '--sui-colors-brand-solid');
  assert.equal(chakra.outlineColor, '--sui-colors-brand-focus-ring');
  assert.equal(mui.accentColor, '--palette-primary-main');
  assert.equal(bootstrap.background, '--custom-body-bg');
});

test('every adapter resolves both light and dark semantic values', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const cases = [
    ['shadcn', { source: 'shadcn' }],
    ['radix', { source: 'radix' }],
    ['daisyui', { source: 'daisyui' }],
    ['chakra', { source: 'chakra', colorPalette: 'brand' }],
    ['mantine', { source: 'mantine' }],
    ['mui', { source: 'mui' }],
    ['joy', { source: 'joy' }],
    ['heroui', { source: 'heroui' }],
    ['bootstrap', { source: 'bootstrap' }],
    ['css', { source: 'css', variables: { accentColor: '--app-primary' } }],
  ];

  for (const [name, inheritance] of cases) {
    const map = api.getThemeVariableMap(inheritance);
    const variable = map.accentColor;
    const env = createEnvironment({
      variables: { [variable]: 'rgb(10, 20, 30)' },
    });

    assert.equal(
      api.resolveThemeAppearance({ inherit: inheritance }, env.mount)
        .accentColor,
      'rgb(10, 20, 30)',
      `${name} light`,
    );

    env.mount.variables[variable] = 'rgb(220, 230, 240)';
    assert.equal(
      api.resolveThemeAppearance({ inherit: inheritance }, env.mount)
        .accentColor,
      'rgb(220, 230, 240)',
      `${name} dark`,
    );
  }
});

test('inherited computed colors are safe for component alpha styles', () => {
  const load = createLoader();
  const themeApi = load('src/utils/themeInheritance');
  const colorApi = load('src/utils/colors');
  const env = createEnvironment({
    variables: { '--primary': 'rgb(12, 16, 131)' },
  });
  const appearance = themeApi.resolveThemeAppearance(
    { inherit: 'shadcn' },
    env.mount,
  );

  assert.doesNotThrow(() => colorApi.hexToRgba(appearance.accentColor, 0.15));
  assert.equal(
    colorApi.hexToRgba(appearance.accentColor, 0.15),
    'rgba(12, 16, 131, 0.15)',
  );
});

test('values are resolved in the active scope before overrides are applied', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const env = createEnvironment({
    variables: {
      '--foreground': 'var(--resolved-foreground)',
      '--resolved-foreground': 'oklch(22% 0.03 250)',
      '--primary': 'rgb(10, 20, 30)',
      '--background': 'hsl(0 0% 98%)',
      '--radius': 'calc(8px + 4px)',
      '--border': 'rgba(30, 40, 50, 0.4)',
      '--ring': 'rgb(60, 70, 80)',
    },
    computed: { fontFamily: 'Inter, sans-serif' },
  });
  env.mount.samples.input = new FakeElement(env.document, {
    computed: { backgroundColor: 'rgb(245, 245, 245)' },
  });
  env.mount.samples.input.parentElement = env.mount;

  const result = api.resolveThemeAppearance(
    {
      inherit: 'shadcn',
      accentColor: '#7c3aed',
      logo: '/logo.svg',
    },
    env.mount,
  );

  assert.equal(result.textColor, 'oklch(22% 0.03 250)');
  assert.equal(result.accentColor, '#7c3aed');
  assert.equal(result.background, 'hsl(0 0% 98%)');
  assert.equal(result.fieldBackground, 'rgb(245, 245, 245)');
  assert.equal(result.borderRadius, '12px');
  assert.equal(result.fontFamily, 'Inter, sans-serif');
  assert.equal(result.logo, '/logo.svg');
  assert.equal(JSON.stringify(result).includes('var('), false);
  assert.equal(JSON.stringify(result).includes('calc('), false);
});

test('nested scopes, CSS mappings, and common CSS color formats are supported', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const env = createEnvironment({
    variables: { '--app-primary': 'rgb(1, 1, 1)' },
  });
  const theme = new FakeElement(env.document, {
    selector: '#nested-theme',
    variables: {
      '--app-text': 'oklch(30% 0.02 240)',
      '--app-primary': 'rgb(2, 3, 4)',
      '--app-surface': 'hsl(220 20% 98%)',
      '--app-backdrop': 'rgba(0, 0, 0, 0.45)',
    },
  });
  env.html.children = [];
  env.html.appendChild(theme);
  theme.appendChild(env.mount);

  const result = api.resolveThemeAppearance(
    {
      inherit: {
        source: 'css',
        scope: '#nested-theme',
        variables: {
          textColor: '--app-text',
          accentColor: '--app-primary',
          background: '--app-surface',
          backdropColor: '--app-backdrop',
        },
      },
    },
    env.mount,
  );

  assert.equal(result.textColor, 'oklch(30% 0.02 240)');
  assert.equal(result.accentColor, 'rgb(2, 3, 4)');
  assert.equal(result.background, 'hsl(220 20% 98%)');
  assert.equal(result.backdropColor, 'rgba(0, 0, 0, 0.45)');
});

test('missing, empty, transparent, and invalid inherited values keep defaults', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const env = createEnvironment({
    variables: {
      '--empty': '',
      '--transparent': 'transparent',
      '--invalid': 'definitely-invalid(',
      '--heroui-primary': 'rgb(200, 0, 0)',
    },
  });
  const result = api.resolveThemeAppearance(
    {
      inherit: {
        source: 'css',
        variables: {
          textColor: '--empty',
          background: '--transparent',
          accentColor: '--invalid',
        },
      },
    },
    env.mount,
  );

  assert.equal(result.textColor, '#000000');
  assert.equal(result.background, '#ffffff');
  assert.equal(result.accentColor, '#0c1083');

  const hero = api.resolveThemeAppearance({ inherit: 'heroui' }, env.mount);
  assert.equal(hero.accentColor, '#0c1083');
});

test('framework collisions and optional prerequisites never trigger guesses', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const env = createEnvironment({
    variables: {
      '--background': 'rgb(240, 240, 240)',
      '--primary': 'rgb(10, 20, 30)',
      '--overlay': 'rgb(30, 20, 10)',
      '--overlay-foreground': 'rgb(250, 250, 250)',
      '--accent': 'rgb(90, 80, 70)',
      '--chakra-colors-blue-solid': 'rgb(0, 0, 255)',
    },
    computed: { fontFamily: 'Scoped App Font' },
  });

  const shadcn = api.resolveThemeAppearance({ inherit: 'shadcn' }, env.mount);
  const hero = api.resolveThemeAppearance({ inherit: 'heroui' }, env.mount);
  const mui = api.resolveThemeAppearance({ inherit: 'mui' }, env.mount);
  const chakra = api.resolveThemeAppearance({ inherit: 'chakra' }, env.mount);

  assert.equal(shadcn.background, 'rgb(240, 240, 240)');
  assert.equal(shadcn.accentColor, 'rgb(10, 20, 30)');
  assert.equal(hero.background, 'rgb(30, 20, 10)');
  assert.equal(hero.accentColor, 'rgb(90, 80, 70)');
  assert.equal(mui.accentColor, '#0c1083');
  assert.equal(mui.fontFamily, 'Scoped App Font');
  assert.equal(chakra.accentColor, '#0c1083');
});

test('values resolve through the scope ownerDocument for iframe-safe snapshots', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const env = createEnvironment({
    variables: {
      '--dialog-radius': 'var(--radius-base)',
      '--radius-base': 'calc(10px + 6px)',
    },
  });
  const originalGetComputedStyle = env.document.defaultView.getComputedStyle;
  let ownerDocumentReads = 0;
  env.document.defaultView.getComputedStyle = (element) => {
    ownerDocumentReads += 1;
    return originalGetComputedStyle(element);
  };

  const result = api.resolveThemeAppearance(
    {
      inherit: {
        source: 'css',
        variables: { borderRadius: '--dialog-radius' },
      },
    },
    env.mount,
  );

  assert.equal(result.borderRadius, '16px');
  assert.ok(ownerDocumentReads > 0);
  assert.equal(result.borderRadius.includes('var('), false);
  assert.equal(result.borderRadius.includes('calc('), false);
});

test('live scope and OS theme changes preserve developer overrides', async () => {
  const api = createLoader()('src/utils/themeInheritance');
  const env = createEnvironment({
    variables: {
      '--foreground': 'rgb(20, 20, 20)',
      '--primary': 'rgb(30, 30, 30)',
      '--background': 'rgb(250, 250, 250)',
    },
  });
  const applied = [];

  const initial = api.configureThemeInheritance(
    { inherit: 'shadcn', accentColor: '#7c3aed' },
    env.mount,
    (appearance) => applied.push(plain(appearance)),
  );
  assert.equal(initial.background, 'rgb(250, 250, 250)');

  env.mount.variables['--foreground'] = 'rgb(240, 240, 240)';
  env.mount.variables['--background'] = 'rgb(10, 10, 10)';
  env.triggerMutation();
  await new Promise((resolvePromise) => setImmediate(resolvePromise));

  assert.equal(applied.at(-1).background, 'rgb(10, 10, 10)');
  assert.equal(applied.at(-1).textColor, 'rgb(240, 240, 240)');
  assert.equal(applied.at(-1).accentColor, '#7c3aed');

  api.updateThemeAppearance({ accentColor: '#2563eb' });
  assert.equal(applied.at(-1).accentColor, '#2563eb');

  env.mount.variables['--background'] = 'rgb(5, 5, 5)';
  env.triggerMedia();
  await new Promise((resolvePromise) => setImmediate(resolvePromise));
  assert.equal(applied.at(-1).background, 'rgb(5, 5, 5)');
  assert.equal(applied.at(-1).accentColor, '#2563eb');

  assert.ok(
    env.observers[0].targets.every(
      ({ observerOptions }) =>
        observerOptions.attributes && !observerOptions.subtree,
    ),
  );
});

test('unknown adapters fail clearly instead of guessing', () => {
  const api = createLoader()('src/utils/themeInheritance');
  const env = createEnvironment();

  assert.throws(
    () =>
      api.resolveThemeAppearance(
        { inherit: /** @type {any} */ ('tailwind') },
        env.mount,
      ),
    /Unsupported appearance inheritance source 'tailwind'/,
  );
});
