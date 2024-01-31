import type { RsbuildPlugin } from '@rsbuild/core';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

type VueJSXPresetOptions = {
  /**
   * Whether to enable the Composition API in Vue.js JSX.
   */
  compositionAPI?: boolean | string;
  /**
   * Whether to enable stateless functional components in Vue.js JSX.
   */
  functional?: boolean;
  /**
   * Whether to enable automatic 'h' injection syntactic sugar.
   * @default true
   */
  injectH?: boolean;
  /**
   * Whether to enable `vModel` syntactic sugar
   */
  vModel?: boolean;
  /**
   * Whether to enable `vOn` syntactic sugar
   */
  vOn?: boolean;
};

export type PluginVueOptions = {
  /**
   * Options passed to `@vue/babel-preset-jsx`.
   * @see https://github.com/vuejs/jsx-vue2
   */
  vueJsxOptions?: VueJSXPresetOptions;
};

export function pluginVue2Jsx(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue2-jsx',

    setup(api) {
      api.modifyBundlerChain((chain, { CHAIN_ID }) => {
        modifyBabelLoaderOptions({
          chain,
          CHAIN_ID,
          modifier: (babelOptions) => {
            babelOptions.presets ??= [];
            babelOptions.presets.push([
              require.resolve('@vue/babel-preset-jsx'),
              {
                injectH: true,
                ...options.vueJsxOptions,
              },
            ]);
            return babelOptions;
          },
        });
      });
    },
  };
}
