import { deepmerge } from '@rsbuild/shared';
import { VueLoaderPlugin } from 'vue-loader';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { VueLoaderOptions } from 'vue-loader';
import { applySplitChunksRule } from './splitChunks';
import { VueLoader15PitchFixPlugin } from './VueLoader15PitchFixPlugin';

export type SplitVueChunkOptions = {
  /**
   * Whether to enable split chunking for Vue-related dependencies (e.g., vue, vue-loader).
   * @default true
   */
  vue?: boolean;
  /**
   * Whether to enable split chunking for vue-router.
   * @default true
   */
  router?: boolean;
};

export type PluginVueOptions = {
  /**
   * Options passed to `vue-loader`.
   * @see https://vue-loader.vuejs.org/
   */
  vueLoaderOptions?: VueLoaderOptions;
  /**
   * This option is used to control the split chunks behavior.
   */
  splitChunks?: SplitVueChunkOptions;
};

export function pluginVue2(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue2',

    setup(api) {
      api.modifyBundlerChain((chain, { CHAIN_ID }) => {
        chain.resolve.extensions.add('.vue');

        // https://github.com/web-infra-dev/rsbuild/issues/1132
        if (!chain.resolve.alias.get('vue$')) {
          chain.resolve.alias.set('vue$', 'vue/dist/vue.runtime.esm.js');
        }

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
        // we could remove this once a new vue-loader@15 is released with https://github.com/vuejs/vue-loader/pull/2071 shipped
        chain
          .plugin(CHAIN_ID.PLUGIN.VUE_LOADER_15_PITCH_FIX_PLUGIN)
          .use(VueLoader15PitchFixPlugin);
      });

      applySplitChunksRule(api, options.splitChunks);
    },
  };
}
