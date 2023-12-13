import { deepmerge } from '@rsbuild/shared';
import { VueLoaderPlugin } from 'vue-loader';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { VueLoaderOptions } from 'vue-loader';
import { applySplitChunksRule } from './splitChunks';

export type SplitVueChunkOptions = {
  vue?: boolean;
  router?: boolean;
};

export type PluginVueOptions = {
  vueLoaderOptions?: VueLoaderOptions;
  splitChunks?: SplitVueChunkOptions;
};

export function pluginVue2(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue2',

    setup(api) {
      api.modifyBundlerChain((chain, { CHAIN_ID }) => {
        chain.resolve.extensions.add('.vue');

        const vueLoaderOptions = deepmerge(
          {
            compilerOptions: {
              preserveWhitespace: false,
            },
            experimentalInlineMatchResource: true,
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

      applySplitChunksRule(api, options.splitChunks);
    },
  };
}
