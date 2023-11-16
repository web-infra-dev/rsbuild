import { describe, it, expect } from 'vitest';
import os from 'os';
import path from 'path';
import { Compiler } from 'webpack';
import { getSDK } from '@rsbuild/doctor-core/plugins';
import { createRsbuildDoctorPlugin } from '../test-utils';
import { compileByWebpack5 } from '@rsbuild/test-helper';

describe('test src/utils/plugin.ts', () => {
  describe('test plugin interceptor', () => {
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

    it('webpack5', async () => {
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
      os.EOL === '\n' && expect(assets[0].content).toMatchSnapshot();

      expect(chunks.length).toBe(1);
      os.EOL === '\n' && expect(chunks).toMatchSnapshot();
    });
  });
});
