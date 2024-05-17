import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import { deepmerge } from '@rsbuild/shared';
import { VueLoaderPlugin } from 'vue-loader';
import type { VueLoaderOptions } from 'vue-loader';
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

export function pluginVue(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: 'rsbuild:vue',

    setup(api) {
      const VUE_REGEXP = /\.vue$/;
      const CSS_MODULES_REGEX = /\.modules?\.\w+$/i;

      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const extraConfig: RsbuildConfig = {
          source: {
            define: {
              // https://link.vuejs.org/feature-flags
              __VUE_OPTIONS_API__: true,
              __VUE_PROD_DEVTOOLS__: false,
              __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
            },
          },
        };

        const merged = mergeRsbuildConfig(extraConfig, config);

        merged.output ||= {};
        merged.output.cssModules ||= {};

        // Support `<style module>` in Vue SFC
        if (merged.output.cssModules.auto === true) {
          merged.output.cssModules.auto = (path, query) => {
            if (VUE_REGEXP.test(path)) {
              return (
                query.includes('type=style') && query.includes('module=true')
              );
            }
            return CSS_MODULES_REGEX.test(path);
          };
        }

        return merged;
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
          .test(VUE_REGEXP)
          .use(CHAIN_ID.USE.VUE)
          .loader(require.resolve('vue-loader'))
          .options(vueLoaderOptions);

        chain.plugin(CHAIN_ID.PLUGIN.VUE_LOADER_PLUGIN).use(VueLoaderPlugin);
      });

      applySplitChunksRule(api, options.splitChunks);
    },
  };
}
