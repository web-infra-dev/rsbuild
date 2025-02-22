import fs from 'node:fs';
import path from 'node:path';
import { build, webpackOnlyTest } from '@e2e/helper';
import { expect, test } from '@playwright/test';
import type { RsbuildConfig } from '@rsbuild/core';
import fse from 'fs-extra';

test('`buildCache.buildDependencies` should work as expected', async () => {
  const cacheDirectory = path.resolve(
    __dirname,
    './node_modules/.cache/test-cache-build-dependencies',
  );

  const testDepsPath = path.resolve(__dirname, './test-temp-deps.js');

  fs.rmSync(cacheDirectory, { recursive: true, force: true });

  const getBuildConfig = (input: string) => {
    fs.writeFileSync(testDepsPath, input);
    return {
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
            buildDependencies: [testDepsPath],
          },
        },
      } as RsbuildConfig,
    };
  };

  // first build without cache
  let rsbuild = await build(getBuildConfig(''));

  expect(
    (await rsbuild.getIndexFile()).content.includes('222222'),
  ).toBeTruthy();

  rsbuild = await build(getBuildConfig('foo'));

  // extension '.test.js' should work
  expect(
    (await rsbuild.getIndexFile()).content.includes('111111'),
  ).toBeTruthy();
});

webpackOnlyTest(
  'should save the buildDependencies to cache directory and hit cache',
  async () => {
    const cacheDirectory = path.resolve(
      __dirname,
      './node_modules/.cache/test-build-dependencies',
    );

    process.env.TEST_ENV = undefined;

    const buildConfig = {
      cwd: __dirname,
      rsbuildConfig: {
        tools: {
          bundlerChain: (chain) => {
            if (process.env.TEST_ENV === 'a') {
              chain.resolve.extensions.prepend('.test.js');
            }
          },
        },
        performance: {
          buildCache: {
            cacheDirectory,
          },
        },
      } as RsbuildConfig,
    };

    const configFile = path.resolve(cacheDirectory, 'buildDependencies.json');

    fs.rmSync(cacheDirectory, { recursive: true, force: true });

    // first build without cache
    let rsbuild = await build(buildConfig);

    expect(
      (await rsbuild.getIndexFile()).content.includes('222222'),
    ).toBeTruthy();

    const buildDependencies = await fse.readJSON(configFile);
    expect(Object.keys(buildDependencies)).toEqual(['tsconfig']);

    process.env.TEST_ENV = 'a';

    // hit cache, so the extension '.test.js' will not work
    rsbuild = await build(buildConfig);

    expect(
      (await rsbuild.getIndexFile()).content.includes('222222'),
    ).toBeTruthy();
  },
);
