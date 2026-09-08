import { copyFile, cp } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { expect, test } from '@e2e/helper';

for (const aliased of [false, true]) {
  test(`should preserve native imports for Solid hydration assets${aliased ? ' with an alias' : ''}`, async ({
    runBoth,
    copySrcDir,
  }) => {
    const alias: Record<string, string> = {};
    if (aliased) {
      const packageDir = path.dirname(
        path.dirname(createRequire(import.meta.url).resolve('@solidjs/web')),
      );
      const localPackage = path.join(await copySrcDir(), 'solid-web');
      await cp(path.join(packageDir, 'dist'), path.join(localPackage, 'dist'), {
        recursive: true,
      });
      await copyFile(
        path.join(packageDir, 'package.json'),
        path.join(localPackage, 'package.json'),
      );
      alias['@solidjs/web'] = path.join(localPackage, 'dist/web.js');
    }

    await runBoth(
      ({ result }) => {
        result.expectNoLog('Critical dependency');
        const content = Object.values(result.getDistFiles()).join('\n');
        expect(content).toContain('import(entryUrl)');
      },
      { config: { resolve: { alias } } },
    );
  });
}
