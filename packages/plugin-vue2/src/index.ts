import { deepmerge } from '@rsbuild/shared/deepmerge';
import { VueLoaderPlugin } from 'vue-loader';
import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import type { VueLoaderOptions } from 'vue-loader';

export type PluginVueOptions = {
  vueLoaderOptions?: VueLoaderOptions;
};

export function pluginVue2(
  options: PluginVueOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-vue2',

    async setup(api) {
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

        // Handle ts syntax when using Rspack
        if (
          api.context.bundlerType === 'rspack' &&
          !chain.module.rules.has(CHAIN_ID.RULE.TS)
        ) {
          chain.module
            .rule(CHAIN_ID.RULE.TS)
            .type('javascript/auto')
            .test(/\.ts$/)
            .use(CHAIN_ID.USE.SWC)
            .loader('builtin:swc-loader')
            .options({
              sourceMap: true,
              jsc: {
                parser: {
                  syntax: 'typescript',
                },
              },
            });
        }

        chain.plugin(CHAIN_ID.PLUGIN.VUE_LOADER_PLUGIN).use(VueLoaderPlugin);
      });
    },
  };
}
