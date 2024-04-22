import type { RsbuildPlugin } from '@rsbuild/core';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';
import { isUsingHMR } from '@rsbuild/shared';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';

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
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
        const config = api.getNormalizedConfig();

        modifyBabelLoaderOptions({
          chain,
          CHAIN_ID,
          modifier: (babelOptions) => {
            babelOptions.plugins ??= [];
            babelOptions.plugins.push([
              require.resolve('@vue/babel-plugin-jsx'),
              options.vueJsxOptions || {},
            ]);

            const usingHMR = isUsingHMR(config, { target, isProd });

            if (usingHMR) {
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
