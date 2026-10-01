const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const path = require('node:path');
const ts = require('typescript');

const fixture = `
export interface IConfig {
    /** Your Blux app id. */
    appId: string;
    /** Display name. */
    appName?: string;
    /** Login methods to offer. */
    loginMethods?: Array<'wallet' | LooseString>;
}
type LooseString = string & {};
`;

test('published config parameters list their fields on hover', async () => {
  const { inlinePublicTypes } = await import('../rollup-inline-public-types.mjs');
  const root = mkdtempSync(path.join(tmpdir(), 'blux-types-'));
  const dist = path.join(root, 'dist');

  mkdirSync(dist);
  writeFileSync(path.join(dist, 'types.d.ts'), fixture);
  writeFileSync(
    path.join(dist, 'index.d.ts'),
    `import { IConfig } from './types';
export type { IConfig } from './types';
export declare function createConfig(config: IConfig): void;
export type Options = IConfig;
`,
  );
  writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({
      name: '@bluxcc/core',
      types: './dist/index.d.ts',
      exports: { '.': { types: './dist/index.d.ts' } },
    }),
  );

  await inlinePublicTypes(dist);
  await inlinePublicTypes(dist);

  const dts = readFileSync(path.join(dist, 'index.d.ts'), 'utf8');

  assert.match(dts, /createConfig\(config: \{[\s\S]*appId: string;/);
  assert.match(dts, /Your Blux app id/);
  assert.match(dts, /\(string & \{\}\)/);
  assert.doesNotMatch(dts, /config: IConfig/);
  assert.match(dts, /export type Options = \{[\s\S]*appName\?: string;/);

  const app = path.join(root, 'app');

  const { symlinkSync } = require('node:fs');

  mkdirSync(path.join(app, 'node_modules', '@bluxcc'), { recursive: true });
  symlinkSync(root, path.join(app, 'node_modules', '@bluxcc', 'core'));
  writeFileSync(
    path.join(app, 'app.ts'),
    `import { createConfig, type IConfig } from '@bluxcc/core';
createConfig({ });
const config: IConfig = { appId: 'x' };
`,
  );
  writeFileSync(
    path.join(app, 'tsconfig.json'),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        module: 'ESNext',
        moduleResolution: 'bundler',
        target: 'ES2022',
        noEmit: true,
      },
      files: ['app.ts'],
    }),
  );

  const parsed = ts.readConfigFile(path.join(app, 'tsconfig.json'), ts.sys.readFile);
  const cmd = ts.parseJsonConfigFileContent(parsed.config, ts.sys, app);
  const file = path.join(app, 'app.ts');
  const service = ts.createLanguageService({
    getCompilationSettings: () => cmd.options,
    getScriptFileNames: () => [file],
    getScriptVersion: () => '1',
    getScriptSnapshot: (name) =>
      ts.sys.fileExists(name)
        ? ts.ScriptSnapshot.fromString(ts.sys.readFile(name))
        : undefined,
    getCurrentDirectory: () => app,
    getDefaultLibFileName: (options) => ts.getDefaultLibFilePath(options),
    fileExists: ts.sys.fileExists,
    readFile: ts.sys.readFile,
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  });
  const source = readFileSync(file, 'utf8');
  const hover = ts.displayPartsToString(
    service.getQuickInfoAtPosition(file, source.indexOf('createConfig('))?.displayParts,
  );
  const completionPos = source.indexOf('createConfig({ ') + 'createConfig({ '.length;
  const completions = service.getCompletionsAtPosition(file, completionPos, {});
  const appId = completions?.entries.find((entry) => entry.name === 'appId');
  const details = service.getCompletionEntryDetails(
    file,
    completionPos,
    'appId',
    {},
    appId?.source,
    undefined,
    appId?.data,
  );

  assert.match(hover, /appId: string/);
  assert.match(hover, /appName\?: string/);
  assert.match(hover, /loginMethods\?:/);
  assert.ok(appId, 'appId is offered by autocomplete');
  assert.match(
    ts.displayPartsToString(details?.documentation),
    /Your Blux app id/,
  );

  const diags = service
    .getSemanticDiagnostics(file)
    .map((diag) => ts.flattenDiagnosticMessageText(diag.messageText, ' '));

  assert.deepEqual(
    diags.filter((message) => !message.includes("Property 'appId' is missing")),
    [],
  );

  rmSync(root, { recursive: true, force: true });
});
