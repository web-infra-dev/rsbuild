import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import type { SharedRsbuildConfig } from '@rsbuild/shared';

type VueJSXPresetOptions = {
  compositionAPI?: boolean | string;
  functional?: boolean;
  injectH?: boolean;
  vModel?: boolean;
  vOn?: boolean;
};

export type PluginVueOptions = {
  vueJsxOptions?: VueJSXPresetOptions;
};

export function pluginVue2Jsx(
  options: PluginVueOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-vue2-jsx',

    async setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        const rsbuildConfig: SharedRsbuildConfig = {
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
    },
  };
}
