const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

const source = readFileSync(
  resolve(__dirname, '../src/utils/colors.ts'),
  'utf8',
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
  },
});
const moduleRef = { exports: {} };

vm.runInNewContext(outputText, {
  module: moduleRef,
  exports: moduleRef.exports,
});

const { getContrastColor, hexToRgba, isBackgroundDark } = moduleRef.exports;

test('alpha colors accept computed rgb values from theme inheritance', () => {
  assert.equal(hexToRgba('rgb(12, 16, 131)', 0.15), 'rgba(12, 16, 131, 0.15)');
  assert.equal(
    hexToRgba('rgba(12, 16, 131, 0.5)', 0.7),
    'rgba(12, 16, 131, 0.7)',
  );
  assert.equal(
    hexToRgba('rgb(12 16 131 / 50%)', 0.1),
    'rgba(12, 16, 131, 0.1)',
  );
});

test('legacy hex colors and common CSS color formats remain supported', () => {
  assert.equal(hexToRgba('#abc', 0.5), 'rgba(170, 187, 204, 0.5)');
  assert.equal(hexToRgba('#abcd', 0.5), 'rgba(170, 187, 204, 0.5)');
  assert.equal(hexToRgba('ffffff', 2), 'rgba(255, 255, 255, 1)');
  assert.equal(hexToRgba('rgb(100% 0% 50%)', -1), 'rgba(255, 0, 128, 0)');
  assert.equal(hexToRgba('hsl(240 100% 50%)', 0.25), 'rgba(0, 0, 255, 0.25)');
});

test('newer or invalid CSS colors never throw during rendering', () => {
  assert.doesNotThrow(() => hexToRgba('oklch(50% 0.2 240)', 0.4));
  assert.equal(
    hexToRgba('oklch(50% 0.2 240)', 0.4),
    'color-mix(in srgb, oklch(50% 0.2 240) 40%, transparent)',
  );
  assert.equal(hexToRgba('', Number.NaN), 'rgba(0, 0, 0, 1)');
  assert.doesNotThrow(() => hexToRgba('not-a-color', 0.5));
});

test('contrast helpers understand inherited rgb and hsl backgrounds', () => {
  assert.equal(getContrastColor('rgb(250, 250, 250)'), '#000000');
  assert.equal(getContrastColor('rgb(12, 16, 31)'), '#FFFFFF');
  assert.equal(isBackgroundDark('hsl(0 0% 95%)'), false);
  assert.equal(isBackgroundDark('hsl(0 0% 5%)'), true);
});
