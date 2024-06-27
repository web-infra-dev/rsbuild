import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { Options } from 'eslint-webpack-plugin';

export type PluginEslintOptions = {
  /**
   * Whether to enable ESLint checking.
   * @default true
   */
  enable?: boolean;
  /**
   * To modify the options of `eslint-webpack-plugin`.
   * @see https://github.com/webpack-contrib/eslint-webpack-plugin
   */
  eslintPluginOptions?: Options;
};

export const PLUGIN_ESLINT_NAME = 'rsbuild:eslint';

export const pluginEslint = (
  options: PluginEslintOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_ESLINT_NAME,

  setup(api) {
    const { enable = true, eslintPluginOptions } = options;

    if (!enable) {
      return;
    }

    api.modifyBundlerChain(async (chain, { CHAIN_ID, environment }) => {
      const { distPath } = api.context.environments[environment];
      // If there is multiple environment, only apply eslint plugin to the first target
      // to avoid multiple eslint running at the same time
      if (environment !== Object.keys(api.context.environments)[0]) {
        return;
      }

      const { default: ESLintPlugin } = await import('eslint-webpack-plugin');
      const defaultOptions = {
        extensions: ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts'],
        exclude: [
          'node_modules',
          path.relative(api.context.rootPath, distPath),
        ],
      };

      chain.plugin(CHAIN_ID.PLUGIN.ESLINT).use(ESLintPlugin, [
        {
          ...defaultOptions,
          ...eslintPluginOptions,
        },
      ]);
    });
  },
});
