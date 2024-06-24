import type { RsbuildPlugin } from '@rsbuild/core';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';

export type PluginVueJsxOptions = {
  /**
   * Options passed to `@vue/babel-plugin-jsx`.
   * @see https://github.com/vuejs/babel-plugin-jsx
   */
  vueJsxOptions?: VueJSXPluginOptions;
};

export const PLUGIN_VUE_JSX_NAME = 'rsbuild:vue-jsx';

export function pluginVueJsx(options: PluginVueJsxOptions = {}): RsbuildPlugin {
  return {
    name: PLUGIN_VUE_JSX_NAME,

    setup(api) {
      api.modifyBundlerChain(
        async (chain, { CHAIN_ID, environment, isProd, target }) => {
          const config = api.getNormalizedConfig({ environment });

          modifyBabelLoaderOptions({
            chain,
            CHAIN_ID,
            modifier: (babelOptions) => {
              babelOptions.plugins ??= [];
              babelOptions.plugins.push([
                require.resolve('@vue/babel-plugin-jsx'),
                options.vueJsxOptions || {},
              ]);

              const usingHMR = !isProd && config.dev.hmr && target === 'web';

              if (usingHMR) {
                babelOptions.plugins ??= [];
                babelOptions.plugins.push([
                  require.resolve('babel-plugin-vue-jsx-hmr'),
                ]);
              }

              return babelOptions;
            },
          });
        },
      );
    },
  };
}
