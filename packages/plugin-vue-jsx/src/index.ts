import path from 'node:path';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';
// import { modifyBabelLoaderOptions } from '@rsbuild/plugin-babel';

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
      api.modifyBundlerChain(async (chain /*, { CHAIN_ID }*/) => {
        // If this is commented out, the e2e/cases/jsx-hmr unit test will not pass.
        // modifyBabelLoaderOptions({
        //   chain,
        //   CHAIN_ID,
        //   modifier: (babelOptions) => {
        //     babelOptions.plugins ??= [];
        //     babelOptions.plugins.push([
        //       require.resolve('@vue/babel-plugin-jsx'),
        //       options.vueJsxOptions || {}
        //     ]);
        //     return babelOptions;
        //   }
        // });

        const rule = chain.module.rule('babel-js');
        if (rule.uses.has('babel')) {
          rule.use('babel').tap((babelOptions) => {
            babelOptions.plugins ??= [];
            babelOptions.plugins.push([
              require.resolve('@vue/babel-plugin-jsx'),
              options.vueJsxOptions || {},
            ]);
            return babelOptions;
          });
        }

        chain.module
          .rule('vue-jsx')
          .test(/\.(jsx|tsx)(\.js)?$/)
          .use('vue-jsx')
          .loader(path.resolve(__dirname, './loader'))
          .options(options.vueJsxOptions ?? {});
      });
    },
  };
}
