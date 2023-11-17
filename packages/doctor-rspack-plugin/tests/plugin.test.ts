import { getSDK } from '@rsbuild/doctor-core/plugins';
import { compileByRspack } from '@rsbuild/test-helper';
import { Compiler } from '@rspack/core';
import path from 'path';
import os from 'os';
import { describe, expect, it } from 'vitest';
import { createDoctorPlugin } from './test-utils';

describe('test rspack-plugin src/plugin.ts', () => {
  describe('test plugin interceptor', () => {
    async function rspackCompile(
      tapName: string,
      compile: typeof compileByRspack,
    ) {
      const file = path.resolve(__dirname, './fixtures/a.js');
      const loader = path.resolve(__dirname, './fixtures/loaders/comment.js');
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
          createDoctorPlugin({}),
          {
            name: tapName,
            apply(compiler: Compiler) {
              compiler.hooks.done.tapPromise(tapName, async () => {
                // nothing
              });
              compiler.hooks.thisCompilation.tap(tapName, (compilation) => {
                compilation.hooks.processAssets.tap(tapName, () => {
                  return 'processAssets end';
                });
              });
            },
          },
        ],
      });

      return res;
    }

    it('rspack plugin intercept', async () => {
      const tapName = 'XXX';
      await rspackCompile(tapName, compileByRspack);
      const sdk = getSDK();
      const { done, thisCompilation } = sdk.getStoreData().plugin;
      const doneData = done.filter((e) => e.tapName === tapName);
      expect(doneData).toHaveLength(1);
      expect(doneData[0].type).toEqual('promise');
      expect(doneData[0].result).toBeNull();

      const sealData = thisCompilation.filter((e) => e.tapName === tapName);
      expect(sealData).toHaveLength(1);
      expect(sealData[0].type).toEqual('sync');
      expect(sealData[0].result).toBeNull();
    });

    it('rspack data store', async () => {
      const tapName = 'XXX';
      await rspackCompile(tapName, compileByRspack);
      const sdk = getSDK();
      const datas = sdk.getStoreData();
      expect(datas.errors.length).toBe(0);
      const graphData = datas.moduleGraph;

      os.EOL === '\n'
        ? expect(
            graphData.modules[0].webpackId.indexOf('tests/fixtures/a.js'),
          ).toBeGreaterThan(0)
        : expect(
            graphData.modules[0].webpackId.indexOf('\\tests\\fixtures\\a.js'),
          ).toBeGreaterThan(0);

      graphData.modules.forEach((mod) => (mod.webpackId = ''));
      expect(graphData).toMatchSnapshot();
    });
  });
});
