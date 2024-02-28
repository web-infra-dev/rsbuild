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

export const pluginEslint = (
  options: PluginEslintOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:eslint',

  setup(api) {
    const { enable = true } = options;

    if (!enable) {
      return;
    }

    api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
      const { default: ESLintPlugin } = await import('eslint-webpack-plugin');

      const pluginOptions: Options = {
        extensions: ['js', 'jsx', 'mjs', 'cjs', 'ts', 'tsx', 'mts', 'cts'],
        ...options.eslintPluginOptions,
      };

      chain.plugin(CHAIN_ID.PLUGIN.ESLINT).use(ESLintPlugin, [pluginOptions]);
    });
  },
});
