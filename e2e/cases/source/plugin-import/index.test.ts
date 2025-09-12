import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { cases, copyPkgToNodeModules, findEntry, shareTest } from './helper';

test('should import with template config', async () => {
  copyPkgToNodeModules();

  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      source: {
        transformImport: [
          {
            libraryName: 'foo',
            customName: 'foo/lib/{{ member }}',
          },
        ],
      },
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });
  const files = rsbuild.getDistFiles({ sourceMaps: true });
  const entry = findEntry(files);
  expect(files[entry]).toContain('transformImport test succeed');
});

test('should not transformImport by default', async () => {
  copyPkgToNodeModules();

  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
  });
  const files = rsbuild.getDistFiles({ sourceMaps: true });
  const entry = findEntry(files);
  expect(files[entry]).toContain('test succeed');
});

for (const c of cases) {
  const [name, entry, config] = c;
  shareTest(`${name}-rspack`, entry, config);
}
