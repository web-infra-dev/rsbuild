import * as path from 'path';
import { expect, test } from '@playwright/test';
import { build } from '@scripts/shared';
import { pluginSwc } from '@rsbuild/plugin-swc';

test('should optimize lodash bundle size when using SWC plugin', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
    },
    rsbuildConfig: {
      performance: {
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
    plugins: [pluginSwc()],
    runServer: false,
  });

  const { content, size } = await rsbuild.getIndexFile();
  expect(content.includes('debounce')).toBeFalsy();
  expect(size < 10).toBeTruthy();
});

test('should not optimize lodash bundle size when transformLodash is false and using SWC plugin', async () => {
  const rsbuild = await build({
    cwd: __dirname,
    entry: {
      index: path.resolve(__dirname, './src/index.ts'),
    },
    rsbuildConfig: {
      performance: {
        transformLodash: false,
        chunkSplit: {
          strategy: 'all-in-one',
        },
      },
    },
    plugins: [pluginSwc()],
    runServer: false,
  });

  const { content, size } = await rsbuild.getIndexFile();
  expect(content.includes('debounce')).toBeTruthy();
  expect(size > 30).toBeTruthy();
});
