import { deepmerge } from '@rsbuild/shared';
import { VueLoaderPlugin } from 'vue-loader';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { VueLoaderOptions } from 'vue-loader';
import { applySplitChunksRule } from './splitChunks';

export type SplitVueChunkOptions = {
  /**
   * Whether to enable split chunking for Vue-related dependencies (e.g., vue, vue-loader).
   *
   * @default true
   */
  vue?: boolean;
  /**
   * Whether to enable split chunking for vue-router.
   *
   * @default true
   */
  router?: boolean;
};

export type PluginVueOptions = {
  vueLoaderOptions?: VueLoaderOptions;
  splitChunks?: SplitVueChunkOptions;
};

export function pluginVue(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue',

    setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
          source: {
            define: {
              // https://link.vuejs.org/feature-flags
              __VUE_OPTIONS_API__: true,
              __VUE_PROD_DEVTOOLS__: false,
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
