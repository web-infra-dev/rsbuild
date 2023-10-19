import { deepmerge } from '@rsbuild/shared/deepmerge';
import { VueLoaderPlugin } from 'vue-loader';
import type { BuilderPlugin } from '@rsbuild/core';
import type { BuilderPluginAPI } from '@rsbuild/webpack';
import type { VueLoaderOptions } from 'vue-loader';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';

export type PluginVueOptions = {
  vueJsxOptions?: VueJSXPluginOptions;
  vueLoaderOptions?: VueLoaderOptions;
};

export function pluginVue(
  options: PluginVueOptions = {},
): BuilderPlugin<BuilderPluginAPI> {
  return {
    name: 'plugin-vue',

    // Remove built-in react plugins.
    // These plugins should be moved to a separate package in the next major version.
    remove: ['plugin-react', 'plugin-antd', 'plugin-arco'],

    async setup(api) {
      api.modifyBuilderConfig((config, { mergeBuilderConfig }) => {
        return mergeBuilderConfig(config, {
          output: {
            disableSvgr: true,
          },
          source: {
            define: {
              // https://link.vuejs.org/feature-flags
              __VUE_OPTIONS_API__: true,
              __VUE_PROD_DEVTOOLS__: false,
            },
          },
          tools: {
            babel(_, { addPlugins }) {
              addPlugins([
                [
                  require.resolve('@vue/babel-plugin-jsx'),
                  options.vueJsxOptions || {},
                ],
              ]);
            },
          },
        });
      });

      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        chain.resolve.extensions.add('.vue');

        const vueLoaderOptions = deepmerge(
          {
            compilerOptions: {
              preserveWhitespace: false,
            },
            experimentalInlineMatchResource:
              api.context.bundlerType === 'rspack',
          },
          options.vueLoaderOptions ?? {},
        );

        chain.module
          .rule(CHAIN_ID.RULE.VUE)
          .test(/\.vue$/)
          .use(CHAIN_ID.USE.VUE)
          .loader(require.resolve('vue-loader'))
          .options(vueLoaderOptions);

        chain.plugin(CHAIN_ID.PLUGIN.VUE_LOADER_PLUGIN).use(VueLoaderPlugin);
      });
    },
  };
}
