const { test } = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { join, resolve } = require('node:path');

const srcRoot = resolve(__dirname, '../src');

const sourceFiles = (dir) => {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...sourceFiles(path));
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(path);
    }
  }

  return files;
};

test('the session bearer token is not written to localStorage', () => {
  const writes = sourceFiles(srcRoot).filter((file) => {
    const text = readFileSync(file, 'utf8');

    return (
      /localStorage\.setItem\(\s*BLUX_JWT_STORE/.test(text) ||
      /localStorage\.setItem\(\s*['"]__BLUX__JWT_STORE['"]/.test(text)
    );
  });

  assert.deepEqual(writes, []);
});

test('recent login storage does not persist a bearer token', () => {
  const text = readFileSync(
    resolve(srcRoot, 'utils/checkRecentLogins.ts'),
    'utf8',
  );
  const writer = text.slice(
    text.indexOf('const writeRecentLogin'),
    text.indexOf('export const scrubStoredBearerTokens'),
  );

  assert.equal(writer.includes('jwt'), false);
});
