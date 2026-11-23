import path from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import fse from 'fs-extra';

test('should cache SVGR loader results when `cache` is true', async ({
  build,
}) => {
  const cacheDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache/test-plugin-svgr-cache',
  );

  await fse.remove(cacheDirectory);

  const config: RsbuildConfig = {
    plugins: [
      pluginReact(),
      pluginSvgr({
        cache: true,
        svgrOptions: {
          exportType: 'default',
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
  const bundle1 = await build1.getIndexBundle();
  expect(bundle1).toContain('cached-icon');
  expect(bundle1).toContain('circle');

  const cacheInfo1 = build1.stats?.toJson({
    all: false,
    cacheInfo: true,
  }).cacheInfo;
  expect(cacheInfo1?.['web|loader']?.hits).toBe(0);
  expect(cacheInfo1?.['web|loader']?.stores).toBeGreaterThan(0);
  await build1.close();

  const build2 = await build({ config });
  expect(await build2.getIndexBundle()).toBe(bundle1);

  const cacheInfo2 = build2.stats?.toJson({
    all: false,
    cacheInfo: true,
  }).cacheInfo;
  expect(cacheInfo2?.['web|loader']?.hits).toBeGreaterThan(0);
  expect(cacheInfo2?.['web|loader']?.reused).toBeGreaterThan(0);
  expect(cacheInfo2?.['web|loader']?.misses).toBe(0);
  await build2.close();
});
