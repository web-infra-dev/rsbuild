import { expect, test } from '@playwright/test';
import { getSDK } from '@rsbuild/doctor-core/plugins';
import { compileByWebpack5 } from '@rsbuild/test-helper';
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
      createRsbuildDoctorPlugin({
        features: ['treeShaking', 'bundle'],
      }),
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

test('webpack5 treeShaking tests', async () => {
  const tapName = 'XXX';
  await webpack(tapName, compileByWebpack5);
  const sdk = getSDK();
  const { moduleGraphModules } = sdk.getStoreData().moduleGraph;
  expect(moduleGraphModules.length).toBe(1);
  expect(moduleGraphModules[0].dynamic).toBeDefined();
});
