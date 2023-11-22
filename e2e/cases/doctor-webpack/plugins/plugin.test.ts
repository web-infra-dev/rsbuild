import { expect, test } from '@playwright/test';
import { getSDK } from '@rsbuild/doctor-core/plugins';
import { compileByWebpack5 } from '@rsbuild/test-helper';
import os from 'os';
import path from 'path';
import { Compiler } from 'webpack';
import { createRsbuildDoctorPlugin } from '../test-utils';

async function webpack(tapName: string, compile: typeof compileByWebpack5) {
  const file = path.resolve(__dirname, '../fixtures/a.js');
  const loader = path.resolve(__dirname, '../fixtures/loaders/comment.js');
  const res = await compile(file, {
    module: {
      rules: [
        {
          test: /\.js/,
          use: loader,
        },
      ],
    },
    plugins: [
      // @ts-ignore
      createRsbuildDoctorPlugin({}),
      // @ts-ignore
      {
        name: tapName,
        // @ts-ignore
        apply(compiler: Compiler) {
          compiler.hooks.done.tapPromise(tapName, async () => {
            // nothing
          });
          compiler.hooks.thisCompilation.tap(tapName, (compilation) => {
            compilation.hooks.seal.tap(tapName, () => {
              return 'seal end';
            });
          });
        },
      },
    ],
  });
  return res;
}

test('webpack5', async () => {
  const tapName = 'XXX';
  await webpack(tapName, compileByWebpack5);
  const sdk = getSDK();
  const { done, seal } = sdk.getStoreData().plugin;

  const doneData = done.filter((e) => e.tapName === tapName);
  expect(doneData).toHaveLength(1);
  expect(doneData[0].type).toEqual('promise');
  expect(doneData[0].result).toBeNull();

  const sealData = seal.filter((e) => e.tapName === tapName);
  expect(sealData).toHaveLength(1);
  expect(sealData[0].type).toEqual('sync');
  expect(sealData[0].result).toBeNull();

  const { assets, chunks } = sdk.getStoreData().chunkGraph;

  expect(assets.length).toBe(1);
  expect(assets[0].chunks.length).toBeGreaterThan(0);
  expect(assets[0].content.length).toBeGreaterThan(10);
  os.EOL === '\n' &&
    expect(assets[0].content).toStrictEqual(
      "/******/ (() => { // webpackBootstrap\nvar __webpack_exports__ = {};\nconsole.log('a');\n\n// hello world\n/******/ })()\n;",
    );

  expect(chunks.length).toBe(1);
  os.EOL === '\n' &&
    expect(chunks).toStrictEqual([
      {
        id: '0',
        name: 'main',
        initial: true,
        size: 33,
        parsedSize: 0,
        entry: true,
        assets: ['bundle.js'],
        modules: [1],
        dependencies: [],
        imported: [],
      },
    ]);
});
