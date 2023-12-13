import type { RsbuildPlugin } from '@rsbuild/core';
import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

type VueJSXPresetOptions = {
  compositionAPI?: boolean | string;
  functional?: boolean;
  injectH?: boolean;
  vModel?: boolean;
  vOn?: boolean;
};

export type PluginVueOptions = {
  vueJsxOptions?: VueJSXPresetOptions;
};

export function pluginVue2Jsx(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue2-jsx',

    pre: ['rsbuild:babel'],

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
