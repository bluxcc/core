import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const CSS_IMPORT = /^import\s+['"][^'"]+\.css['"];?\s*\n?/gm;

async function stripDir(dir) {
  const entries = await readdir(dir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      const path = join(dir, entry.name);

      if (entry.isDirectory()) {
        await stripDir(path);
        return;
      }

      if (!entry.name.endsWith('.d.ts')) {
        return;
      }

      const source = await readFile(path, 'utf8');
      const next = source.replace(CSS_IMPORT, '');

      if (next !== source) {
        await writeFile(path, next);
      }
    }),
  );
}

/** Published .d.ts files must not import CSS — consumers have no matching file. */
export function stripCssFromDts(dir = 'dist') {
  return {
    name: 'strip-css-from-dts',
    async writeBundle() {
      await stripDir(dir);
      await writeFile(
        join(dir, 'tailwind.css.d.ts'),
        'declare const styles: Record<string, string>;\nexport default styles;\n',
      );
    },
  };
}
