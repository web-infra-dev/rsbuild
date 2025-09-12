import { expect, test } from '@e2e/helper';
import { cases, copyPkgToNodeModules, findEntry, shareTest } from './helper';

test('should import with template config', async ({ build, buildOnly }) => {
  copyPkgToNodeModules();

  const rsbuild = await buildOnly({
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

test('should not transformImport by default', async ({ build, buildOnly }) => {
  copyPkgToNodeModules();

  const rsbuild = await buildOnly({
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
