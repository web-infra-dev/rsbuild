import { deepmerge } from '@rsbuild/shared/deepmerge';
import { VueLoaderPlugin } from 'vue-loader';
import type { RsbuildPlugin } from '@rsbuild/core';
import type { RsbuildPluginAPI } from '@rsbuild/webpack';
import type { SharedRsbuildConfig } from '@rsbuild/shared';
import type { VueLoaderOptions } from 'vue-loader';

type VueJSXPresetOptions = {
  compositionAPI?: boolean | string;
  functional?: boolean;
  injectH?: boolean;
  vModel?: boolean;
  vOn?: boolean;
};

export type PluginVueOptions = {
  vueJsxOptions?: VueJSXPresetOptions;
  vueLoaderOptions?: VueLoaderOptions;
};

export function pluginVue2(
  options: PluginVueOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-vue2',

    // Remove built-in react plugins.
    // These plugins should be moved to a separate package in the next major version.
    remove: ['plugin-react', 'plugin-antd', 'plugin-arco'],

    async setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const rsbuildConfig: SharedRsbuildConfig = {
          output: {
            disableSvgr: true,
          },
          tools: {
            babel(_, { addPresets }) {
              addPresets([
                [
                  require.resolve('@vue/babel-preset-jsx'),
                  {
                    injectH: true,
                    ...options.vueJsxOptions,
                  },
                ],
              ]);
            },
          },
        };

        return mergeRsbuildConfig(config, rsbuildConfig);
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
