import type { RsbuildPlugin } from '@rsbuild/core';
import type { VueJSXPluginOptions } from '@vue/babel-plugin-jsx';

export type PluginVueJsxOptions = {
  vueJsxOptions?: VueJSXPluginOptions;
};

export function pluginVueJsx(options: PluginVueJsxOptions = {}): RsbuildPlugin {
  return {
    name: 'plugin-vue-jsx',

    pre: ['plugin-babel'],

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI].forEach((ruleId) => {
          if (chain.module.rules.has(ruleId)) {
            const rule = chain.module.rule(ruleId);

            if (rule.uses.has(CHAIN_ID.USE.BABEL)) {
              // add babel plugin
              rule.use(CHAIN_ID.USE.BABEL).tap((babelConfig) => {
                babelConfig.plugins ??= [];
                babelConfig.plugins.push([
                  require.resolve('@vue/babel-plugin-jsx'),
                  options.vueJsxOptions || {},
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
