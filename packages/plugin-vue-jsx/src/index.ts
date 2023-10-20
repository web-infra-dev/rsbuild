import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';

export type PluginVueJsxOptions = {
  vueJsxOptions?: VueJSXPluginOptions;
};

export function pluginVueJsx(
  options: PluginVueJsxOptions = {},
): RsbuildPlugin<RsbuildPluginAPI> {
  return {
    name: 'plugin-vue-jsx',

    async setup(api) {
      api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
        return mergeRsbuildConfig(config, {
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
    },
  };
}
