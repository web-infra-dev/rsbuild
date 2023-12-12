import type { RsbuildPlugin } from '@rsbuild/core';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

export type PluginVueJsxOptions = {
  vueJsxOptions?: VueJSXPluginOptions;
};

export function pluginVueJsx(options: PluginVueJsxOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue-jsx',

    pre: ['rsbuild:babel'],

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        modifyBabelLoaderOptions({
          chain,
          CHAIN_ID,
          modifier: (babelOptions) => {
            babelOptions.plugins ??= [];
            babelOptions.plugins.push([
              require.resolve('@vue/babel-plugin-jsx'),
              options.vueJsxOptions || {},
            ]);
            return babelOptions;
          },
        });
      });
    },
  };
}
