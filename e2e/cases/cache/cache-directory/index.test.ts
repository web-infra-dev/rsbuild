import fs from 'node:fs';
import path from 'node:path';
import { build, dev } from '@e2e/helper';
import { expect, test } from '@playwright/test';

test('`buildCache.cacheDirectory` should work as expected in development mode', async ({
  page,
}) => {
  const defaultDirectory = path.resolve(__dirname, './node_modules/.cache');
  const cacheDirectory = path.resolve(__dirname, './node_modules/.cache2');
  fs.rmSync(defaultDirectory, { recursive: true, force: true });
  fs.rmSync(cacheDirectory, { recursive: true, force: true });

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

test('`buildCache.cacheDirectory` should work as expected in production mode', async () => {
  const defaultDirectory = path.resolve(__dirname, './node_modules/.cache');
  const cacheDirectory = path.resolve(__dirname, './node_modules/.cache2');
  fs.rmSync(defaultDirectory, { recursive: true, force: true });
  fs.rmSync(cacheDirectory, { recursive: true, force: true });

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
