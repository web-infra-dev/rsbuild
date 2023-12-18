import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';

// TODO: needs builtin:swc-loader wasm plugin
// Not supported yet
test.skip('should optimize lodash bundle size by default', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
    runServer: false,
  });

  const { content, size } = await rsbuild.getIndexFile();
  expect(content.includes('debounce')).toBeFalsy();
  expect(size < 10).toBeTruthy();
});

// Not supported yet
test.skip('should not optimize lodash bundle size when transformLodash is false', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    rsbuildConfig: {
      performance: {
        transformLodash: false,
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
    runServer: false,
  });

  const { content, size } = await rsbuild.getIndexFile();
  expect(content.includes('debounce')).toBeTruthy();
  expect(size > 30).toBeTruthy();
});
