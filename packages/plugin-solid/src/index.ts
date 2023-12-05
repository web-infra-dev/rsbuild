import type { RsbuildPlugin } from '@rsbuild/core';
import type { SolidPresetOptions } from './types';

export type PluginSolidPresetOptions = {
  solidPresetOptions?: SolidPresetOptions;
};

export function pluginSolid(
  options: PluginSolidPresetOptions = {},
): RsbuildPlugin {
  return {
    name: 'rsbuild:solid',

    pre: ['rsbuild:babel'],

    setup(api) {
      api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
        [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI].forEach((ruleId) => {
          if (chain.module.rules.has(ruleId)) {
            const rsbuildConfig = api.getNormalizedConfig();
            const rule = chain.module.rule(ruleId);

            if (rule.uses.has(CHAIN_ID.USE.BABEL)) {
              // add babel preset
              rule.use(CHAIN_ID.USE.BABEL).tap((babelConfig) => {
                babelConfig.presets ??= [];
                babelConfig.presets.push([
                  require.resolve('babel-preset-solid'),
                  options.solidPresetOptions || {},
                ]);

                if (!isProd && rsbuildConfig.dev.hmr) {
                  babelConfig.plugins ??= [];
                  babelConfig.plugins.push([
                    require.resolve('solid-refresh/babel'),
                  ]);

                  chain.resolve.alias.merge({
                    'solid-refresh': require.resolve(
                      'solid-refresh/dist/solid-refresh.mjs',
                    ),
                  });
                }

                return babelConfig;
              });
            }
          }
        });
      });
    },
  };
}
