import type { RsbuildPlugin } from '@rsbuild/core';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

export type PluginVueJsxOptions = {
  /**
   * Options passed to `@vue/babel-plugin-jsx`.
   * @see https://github.com/vuejs/babel-plugin-jsx
   */
  vueJsxOptions?: VueJSXPluginOptions;
};

export function pluginVueJsx(options: PluginVueJsxOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue-jsx',

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isDev }) => {
        const rsbuildConfig = api.getNormalizedConfig();

        modifyBabelLoaderOptions({
          chain,
          CHAIN_ID,
          modifier: (babelOptions) => {
            babelOptions.plugins ??= [];
            babelOptions.plugins.push([
              require.resolve('@vue/babel-plugin-jsx'),
              options.vueJsxOptions || {},
            ]);

            if (isDev && rsbuildConfig.dev.hmr) {
              babelOptions.plugins ??= [];
              babelOptions.plugins.push([
                require.resolve('babel-plugin-vue-jsx-hmr'),
              ]);
            }

            return babelOptions;
          },
        });
      });
    },
  };
}
