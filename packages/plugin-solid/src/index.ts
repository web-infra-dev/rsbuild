import type { RsbuildPlugin } from '@rsbuild/core';

export type PluginSolidPresetOptions = {
  // TODO: complete the type declaration
  solidPresetOptions?: any;
};

export function pluginSolid(
  options: PluginSolidPresetOptions = {},
): RsbuildPlugin {
  return {
    name: 'plugin-solid',

    pre: ['plugin-babel'],

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID }) => {
        [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI].forEach((ruleId) => {
          if (chain.module.rules.has(ruleId)) {
            const rule = chain.module.rule(ruleId);

            if (rule.uses.has(CHAIN_ID.USE.BABEL)) {
              // add babel preset
              rule.use(CHAIN_ID.USE.BABEL).tap((babelConfig) => {
                babelConfig.presets ??= [];
                babelConfig.presets.push([
                  require.resolve('babel-preset-solid'),
                  options.solidPresetOptions || {},
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
