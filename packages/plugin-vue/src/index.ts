import { createRequire } from 'node:module';
import type { EnvironmentConfig, RsbuildPlugin } from '@rsbuild/core';
import { type VueLoaderOptions, VueLoaderPlugin } from 'vue-loader';
import { applySplitChunksRule } from './splitChunks.js';

const require = createRequire(import.meta.url);

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

export const PLUGIN_VUE_NAME = 'rsbuild:vue';

export function pluginVue(options: PluginVueOptions = {}): RsbuildPlugin {
  return {
    name: PLUGIN_VUE_NAME,

    setup(api) {
      const VUE_REGEXP = /\.vue$/;
      const CSS_MODULES_REGEX = /\.modules?\.\w+$/i;

      api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
        const extraConfig: EnvironmentConfig = {
          source: {
            define: {
              // https://link.vuejs.org/feature-flags
              __VUE_OPTIONS_API__: true,
              __VUE_PROD_DEVTOOLS__: false,
              __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
            },
            // should transpile all scripts from Vue SFC
            include: [/\.vue.js$/],
          },
        };

        const merged = mergeEnvironmentConfig(extraConfig, config);

        // Support `<style module>` in Vue SFC
        if (merged.output.cssModules.auto === true) {
          merged.output.cssModules.auto = (path, query) => {
            // For Vue style block, the path might be like:
            // 1. `/path/to/Foo.vue`
            // 2. `/path/to/Foo.vue.css?query=...`
            if (VUE_REGEXP.test(path) || path.includes('.vue.css')) {
              return query.includes('type=style') && query.includes('module=');
            }
            return CSS_MODULES_REGEX.test(path);
          };
        }

        return merged;
      });

      api.modifyBundlerChain((chain, { CHAIN_ID }) => {
        chain.resolve.extensions.add('.vue');

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

        chain
          .plugin(CHAIN_ID.PLUGIN.VUE_LOADER_PLUGIN)
          // Ensure that the VueLoaderPlugin is applied before the ReactFastRefreshPlugin
          // otherwise the VueLoaderPlugin will throw an error for `builtin:react-refresh-loader`
          .before(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
          .use(VueLoaderPlugin);
      });

      applySplitChunksRule(api, options.splitChunks);
    },
  };
}
