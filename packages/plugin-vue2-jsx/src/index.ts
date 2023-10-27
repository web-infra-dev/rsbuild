import type { RsbuildPlugin, RsbuildPluginAPI } from '@rsbuild/core';

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

    pre: ['plugin-babel'],

    async setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI].forEach((ruleId) => {
          if (chain.module.rules.has(ruleId)) {
            const rule = chain.module.rule(ruleId);

            if (rule.uses.has(CHAIN_ID.USE.BABEL)) {
              // add babel preset
              rule.use(CHAIN_ID.USE.BABEL).tap((babelConfig) => {
                babelConfig.presets ??= [];
                babelConfig.presets.push([
                  require.resolve('@vue/babel-preset-jsx'),
                  {
                    injectH: true,
                    ...options.vueJsxOptions,
                  },
                ]);
                return babelConfig;
              });
            }
          }
        });
      });
    },
  };
}
