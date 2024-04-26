import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('should support using transformImport to reduce lodash bundle size', async () => {
  const rsbuild = await build({
    cwd: __dirname,
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

  const { size, content } = await rsbuild.getIndexFile();

  expect(content.includes('debounce')).toBeFalsy();
  expect(size < 10).toBeTruthy();
});
