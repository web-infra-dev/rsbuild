import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@e2e/helper';
import fse from 'fs-extra';

function copyPkgToNodeModules() {
  const nodeModules = path.resolve(import.meta.dirname, 'node_modules');
  const target = path.resolve(nodeModules, 'foo');

  fse.removeSync(target);
  fse.ensureDirSync(nodeModules);
  fs.cpSync(path.resolve(import.meta.dirname, 'foo'), target, {
    recursive: true,
  });
}

test('should support ignoreEsComponent and ignoreStyleComponent', async ({ build }) => {
  copyPkgToNodeModules();

  const rsbuild = await build({
    config: {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            libraryDirectory: 'lib',
            style: true,
            ignoreEsComponent: ['IgnoredScript'],
            ignoreStyleComponent: ['IgnoredStyle'],
          },
        ],
      },
      splitChunks: false,
    },
  });
  const content = await rsbuild.getIndexBundle();

  expect(content).toContain('ignoreEsComponent test succeed');
  expect(content).toContain('transformImport button component succeed');
  expect(content).toContain('transformImport button style succeed');
  expect(content).toContain('ignoreStyleComponent JS import succeed');
  expect(content).not.toContain('ignoreStyleComponent style import should not be bundled');
});
