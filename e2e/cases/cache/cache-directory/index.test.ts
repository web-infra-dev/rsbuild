import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@e2e/helper';
import { remove } from 'fs-extra';

test('should use `buildCache.cacheDirectory` as expected in dev', async ({
  dev,
}) => {
  const defaultDirectory = path.resolve(__dirname, './node_modules/.cache');
  const cacheDirectory = path.resolve(__dirname, './node_modules/.cache2');
  await remove(defaultDirectory);
  await remove(cacheDirectory);

  await dev({
    rsbuildConfig: {
      performance: {
        buildCache: {
          cacheDirectory,
        },
      },
    },
  });

  expect(fs.existsSync(cacheDirectory)).toBeTruthy();
  expect(fs.existsSync(defaultDirectory)).toBeFalsy();
});

test('should use `buildCache.cacheDirectory` as expected in build', async ({
  build,
}) => {
  const defaultDirectory = path.resolve(__dirname, './node_modules/.cache');
  const cacheDirectory = path.resolve(__dirname, './node_modules/.cache2');
  await remove(defaultDirectory);
  await remove(cacheDirectory);

  await build({
    rsbuildConfig: {
      performance: {
        buildCache: {
          cacheDirectory,
        },
      },
    },
  });

  expect(fs.existsSync(cacheDirectory)).toBeTruthy();
  expect(fs.existsSync(defaultDirectory)).toBeFalsy();
});
