import type { RsbuildPlugin } from '@rsbuild/core';
import { type VueLoaderOptions, VueLoaderPlugin } from 'vue-loader';
import { VueLoader15PitchFixPlugin } from './VueLoader15PitchFixPlugin';
import { applySplitChunksRule } from './splitChunks';

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

export const PLUGIN_VUE2_NAME = 'rsbuild:vue2';

export function pluginVue2(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: PLUGIN_VUE2_NAME,

    setup(api) {
      const VUE_REGEXP = /\.vue$/;
      const CSS_MODULES_REGEX = /\.modules?\.\w+$/i;

      api.modifyRsbuildConfig((config) => {
        config.output ||= {};
        config.output.cssModules ||= {};

        // Support `<style module>` in Vue SFC
        if (config.output.cssModules.auto === true) {
          config.output.cssModules.auto = (path, query) => {
            if (VUE_REGEXP.test(path)) {
              return (
                query.includes('type=style') && query.includes('module=true')
              );
            }
            return CSS_MODULES_REGEX.test(path);
          };
        }

        return config;
      });

      api.modifyBundlerChain((chain, { CHAIN_ID }) => {
        chain.resolve.extensions.add('.vue');

        // https://github.com/web-infra-dev/rsbuild/issues/1132
        if (!chain.resolve.alias.get('vue$')) {
          chain.resolve.alias.set('vue$', 'vue/dist/vue.runtime.esm.js');
        }

        const userLoaderOptions = options.vueLoaderOptions ?? {};
        const compilerOptions = {
          preserveWhitespace: false,
          ...userLoaderOptions.compilerOptions,
        };
        const vueLoaderOptions = {
          experimentalInlineMatchResource: true,
          ...userLoaderOptions,
          compilerOptions,
        };

        chain.module
          .rule(CHAIN_ID.RULE.VUE)
          .test(VUE_REGEXP)
          .use(CHAIN_ID.USE.VUE)
          .loader(require.resolve('vue-loader'))
          .options(vueLoaderOptions);

        // Support for lang="postcss" and lang="pcss" in SFC
        chain.module.rule(CHAIN_ID.RULE.CSS).test(/\.(?:css|postcss|pcss)$/);

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
