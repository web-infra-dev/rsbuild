import { PLUGIN_BABEL_NAME, type RsbuildPlugin } from '@rsbuild/core';
import type { SolidPresetOptions } from './types';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

export type PluginSolidPresetOptions = {
  solidPresetOptions?: SolidPresetOptions;
};

export const PLUGIN_SOLID_NAME = 'rsbuild:solid';

export function pluginSolid(
  options: PluginSolidPresetOptions = {},
): RsbuildPlugin {
  return {
    name: PLUGIN_SOLID_NAME,

    pre: [PLUGIN_BABEL_NAME],

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
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

            if (!isProd && rsbuildConfig.dev.hmr) {
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
