import path from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildConfig } from '@rsbuild/core';
import { pluginBabel } from '@rsbuild/plugin-babel';
import fse from 'fs-extra';

test('should cache Babel loader results when `cache` is true', async ({
  build,
}) => {
  const cacheDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache/test-plugin-babel-cache',
  );

  await fse.remove(cacheDirectory);

  const config: RsbuildConfig = {
    plugins: [
      pluginBabel({
        cache: true,
        babelLoaderOptions: {
          plugins: [
            path.resolve(import.meta.dirname, './plugins/replace-message.mjs'),
          ],
        },
      }),
    ],
    performance: {
      buildCache: {
        cacheDirectory,
      },
    },
    tools: {
      rspack: {
        experiments: {
          newCache: {
            module: false,
            loader: true,
          },
        },
      },
    },
  };

  const build1 = await build({ config });
  expect(
    (await build1.getIndexBundle()).includes('compiled by cached babel-loader'),
  ).toBe(true);
  expect(await fse.pathExists(path.join(cacheDirectory, 'babel-loader'))).toBe(
    false,
  );

  const cacheInfo1 = build1.stats?.toJson({
    all: false,
    cacheInfo: true,
  }).cacheInfo;
  expect(cacheInfo1?.['web|loader']?.hits).toBe(0);
  expect(cacheInfo1?.['web|loader']?.stores).toBeGreaterThan(0);
  await build1.close();

  const build2 = await build({ config });
  expect(
    (await build2.getIndexBundle()).includes('compiled by cached babel-loader'),
  ).toBe(true);
  expect(await fse.pathExists(path.join(cacheDirectory, 'babel-loader'))).toBe(
    false,
  );

  const cacheInfo2 = build2.stats?.toJson({
    all: false,
    cacheInfo: true,
  }).cacheInfo;
  expect(cacheInfo2?.['web|loader']?.hits).toBeGreaterThan(0);
  expect(cacheInfo2?.['web|loader']?.reused).toBeGreaterThan(0);
  expect(cacheInfo2?.['web|loader']?.misses).toBe(0);
  await build2.close();
});
