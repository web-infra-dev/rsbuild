import path from 'node:path';

import { expect, test } from '@e2e/helper';
import type { RsbuildConfig } from '@rsbuild/core';
import { remove } from 'fs-extra';

test('should respect `buildCache.cacheDigest`', async ({ buildOnly }) => {
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
  let rsbuild = await buildOnly(getBuildConfig(''));

  expect((await rsbuild.getIndexBundle()).includes('222222')).toBeTruthy();

  rsbuild = await buildOnly(getBuildConfig('foo'));

  // extension '.test.js' should work
  expect((await rsbuild.getIndexBundle()).includes('111111')).toBeTruthy();
});
