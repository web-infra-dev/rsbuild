import path from 'node:path';
import { build } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildConfig } from '@rsbuild/core';
import { remove } from 'fs-extra';

test('should respect `buildCache.cacheDigest`', async () => {
  const cacheDirectory = path.resolve(
    __dirname,
    './node_modules/.cache/test-cache-digest',
  );

  await remove(cacheDirectory);

  const getBuildConfig = (input: string) => ({
    cwd: __dirname,
    rsbuildConfig: {
      tools: {
        bundlerChain: (chain) => {
          if (input === 'foo') {
            chain.resolve.extensions.prepend('.test.js');
          }
        },
      },
      performance: {
        buildCache: {
          cacheDirectory,
          cacheDigest: [input],
        },
      },
    } as RsbuildConfig,
  });

  // first build without cache
  let rsbuild = await build(getBuildConfig(''));

  expect((await rsbuild.getIndexBundle()).includes('222222')).toBeTruthy();

  rsbuild = await build(getBuildConfig('foo'));

  // extension '.test.js' should work
  expect((await rsbuild.getIndexBundle()).includes('111111')).toBeTruthy();
});
