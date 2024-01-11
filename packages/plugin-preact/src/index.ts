import type { RsbuildPlugin } from '@rsbuild/core';
import type { SwcReactConfig } from '@rsbuild/shared';

export type PluginPreactOptions = {
  /**
   * Whether to aliases `react`, `react-dom` to `preact/compat`
   * @default true
   */
  reactAliasesEnabled?: boolean;
};

export const pluginPreact = (
  options: PluginPreactOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:preact',

  pre: ['rsbuild:swc'],

  setup(api) {
    const { reactAliasesEnabled = true } = options;

    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      if (reactAliasesEnabled) {
        chain.resolve.alias.merge({
          react: 'preact/compat',
          'react-dom/test-utils': 'preact/test-utils',
          'react-dom': 'preact/compat',
          'react/jsx-runtime': 'preact/jsx-runtime',
        });
      }

      const reactOptions: SwcReactConfig = {
        development: !isProd,
        runtime: 'automatic',
        importSource: 'preact',
      };

      [CHAIN_ID.RULE.JS, CHAIN_ID.RULE.JS_DATA_URI].forEach((ruleId) => {
        if (chain.module.rules.has(ruleId)) {
          const rule = chain.module.rule(ruleId);
          if (rule.uses.has(CHAIN_ID.USE.SWC)) {
            rule.use(CHAIN_ID.USE.SWC).tap((options) => {
              options.jsc.transform.react = {
                ...reactOptions,
              };
              return options;
            });
          }
        }
      });
    });
  },
});
