import fs from 'node:fs';
import path from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import { remove } from 'fs-extra';

test('`buildCache.cacheDirectory` should work as expected in dev', async ({
  page,
}) => {
  const defaultDirectory = path.resolve(__dirname, './node_modules/.cache');
  const cacheDirectory = path.resolve(__dirname, './node_modules/.cache2');
  await remove(defaultDirectory);
  await remove(cacheDirectory);

  const rsbuild = await dev({
    page,
    cwd: __dirname,
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
  await rsbuild.close();
});

test('`buildCache.cacheDirectory` should work as expected in build', async () => {
  const defaultDirectory = path.resolve(__dirname, './node_modules/.cache');
  const cacheDirectory = path.resolve(__dirname, './node_modules/.cache2');
  await remove(defaultDirectory);
  await remove(cacheDirectory);

  await build({
    cwd: __dirname,
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
