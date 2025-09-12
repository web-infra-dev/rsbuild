import fs from 'node:fs';
import path from 'node:path';
import { dev, expect, test } from '@e2e/helper';
import { remove } from 'fs-extra';

test('should use `buildCache.cacheDirectory` as expected in dev', async ({
  page,
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
  buildOnly,
}) => {
  const defaultDirectory = path.resolve(__dirname, './node_modules/.cache');
  const cacheDirectory = path.resolve(__dirname, './node_modules/.cache2');
  await remove(defaultDirectory);
  await remove(cacheDirectory);

  await buildOnly({
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
