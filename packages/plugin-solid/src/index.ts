import { createRequire } from 'node:module';
import type { RsbuildPlugin } from '@rsbuild/core';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';
import type { SolidPresetOptions } from './types.js';

const require = createRequire(import.meta.url);

export type PluginSolidOptions = {
  /**
   * Whether to inject Solid Refresh for HMR in development mode.
   * @default true
   */
  hot?: boolean;
  /**
   * Options passed to `babel-preset-solid`.
   * @see https://npmjs.com/package/babel-preset-solid
   */
  solidPresetOptions?: SolidPresetOptions;
};

export const PLUGIN_SOLID_NAME = 'rsbuild:solid';

export function pluginSolid(options: PluginSolidOptions = {}): RsbuildPlugin {
  const { hot = true } = options;

  return {
    name: PLUGIN_SOLID_NAME,

    setup(api) {
      api.modifyEnvironmentConfig((config) => {
        const conditionNames = config.resolve.conditionNames ?? ['...'];
        // Prefer Solid-specific exports while preserving user conditions or Rspack defaults.
        config.resolve.conditionNames = conditionNames.includes('solid')
          ? conditionNames
          : ['solid', ...conditionNames];
      });

      api.modifyBundlerChain(
        (chain, { CHAIN_ID, environment, isProd, target }) => {
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
                hot && !isProd && environmentConfig.dev.hmr && target === 'web';
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
