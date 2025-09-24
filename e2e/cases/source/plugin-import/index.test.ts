import { expect, test } from '@e2e/helper';
import { cases, copyPkgToNodeModules, findEntry, shareTest } from './helper';

test('should import with template config', async ({ build }) => {
  copyPkgToNodeModules();

  const rsbuild = await build({
    config: {
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

test('should not transformImport by default', async ({ build }) => {
  copyPkgToNodeModules();

  const rsbuild = await build({
    config: {
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
