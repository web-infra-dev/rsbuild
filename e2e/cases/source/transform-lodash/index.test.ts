import { expect, test } from '@e2e/helper';

test('should support using transformImport to reduce lodash bundle size', async ({
  build,
  buildOnly,
}) => {
  const rsbuild = await buildOnly({
    rsbuildConfig: {
      source: {
        transformImport: [
          {
            libraryName: 'lodash',
            customName: 'lodash/{{ member }}',
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

  const content = await rsbuild.getIndexBundle();
  const size = content.length / 1024;

  expect(content.includes('debounce')).toBeFalsy();
  expect(size < 10).toBeTruthy();
});
