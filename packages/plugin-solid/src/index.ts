import type { RsbuildPlugin } from '@rsbuild/core';
import type { SolidPresetOptions } from './types';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

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
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isDev }) => {
        const rsbuildConfig = api.getNormalizedConfig();

        modifyBabelLoaderOptions({
          chain,
          CHAIN_ID,
          modifier: (babelOptions) => {
            babelOptions.presets ??= [];
            babelOptions.presets.push([
              require.resolve('babel-preset-solid'),
              options.solidPresetOptions || {},
            ]);

            if (isDev && rsbuildConfig.dev.hmr) {
              babelOptions.plugins ??= [];
              babelOptions.plugins.push([
                require.resolve('solid-refresh/babel'),
              ]);

              chain.resolve.alias.merge({
                'solid-refresh': require.resolve(
                  'solid-refresh/dist/solid-refresh.mjs',
                ),
              });
            }

            return babelOptions;
          },
        });
      });
    },
  };
}
