import { createRequire } from 'node:module';
import type { RsbuildPlugin } from '@rsbuild/core';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';
import type { SolidPresetOptions } from './types.js';

const require = createRequire(import.meta.url);

export type PluginSolidOptions = {
  /**
   * Options passed to `babel-preset-solid`.
   * @see https://www.npmjs.com/package/babel-preset-solid
   */
  solidPresetOptions?: SolidPresetOptions;
};

export const PLUGIN_SOLID_NAME = 'rsbuild:solid';

export function pluginSolid(options: PluginSolidOptions = {}): RsbuildPlugin {
  return {
    name: PLUGIN_SOLID_NAME,

    setup(api) {
      api.modifyBundlerChain(
        async (chain, { CHAIN_ID, environment, isProd, target }) => {
          const environmentConfig = environment.config;

          modifyBabelLoaderOptions({
            chain,
            CHAIN_ID,
            modifier: (babelOptions) => {
              babelOptions.presets = [
                [
                  require.resolve('babel-preset-solid'),
                  options.solidPresetOptions || {},
                ],
              ];
              babelOptions.parserOpts = { plugins: ['jsx', 'typescript'] };

              const usingHMR =
                !isProd && environmentConfig.dev.hmr && target === 'web';
              if (usingHMR) {
                babelOptions.plugins ??= [];
                babelOptions.plugins.push([
                  require.resolve('solid-refresh/babel'),
                ]);

                chain.resolve.alias.set(
                  'solid-refresh',
                  require.resolve('solid-refresh/dist/solid-refresh.mjs'),
                );
              }

              return babelOptions;
            },
          });
        },
      );
    },
  };
}
