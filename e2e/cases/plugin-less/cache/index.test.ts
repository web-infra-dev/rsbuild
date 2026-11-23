import path from 'node:path';
import { expect, test } from '@e2e/helper';
import type { RsbuildConfig } from '@rsbuild/core';
import { pluginLess } from '@rsbuild/plugin-less';
import { getFileContent } from '@rstackjs/test-utils';
import fse from 'fs-extra';

test('should cache Less loader results when `cache` is true', async ({
  build,
}) => {
  const cacheDirectory = path.resolve(
    import.meta.dirname,
    './node_modules/.cache/test-plugin-less-cache',
  );

  await fse.remove(cacheDirectory);

  const config: RsbuildConfig = {
    plugins: [
      pluginLess({
        cache: true,
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
  expect(getFileContent(build1.getDistFiles(), '.css')).toBe('body{color:red}');
  const bundle1 = await build1.getIndexBundle();
  expect(bundle1).toContain('div{background-color:#00f}');

  const cacheInfo1 = build1.stats?.toJson({
    all: false,
    cacheInfo: true,
  }).cacheInfo;
  expect(cacheInfo1?.['web|loader']?.hits).toBe(0);
  expect(cacheInfo1?.['web|loader']?.stores).toBeGreaterThan(0);
  await build1.close();

  const build2 = await build({ config });
  expect(getFileContent(build2.getDistFiles(), '.css')).toBe('body{color:red}');
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
