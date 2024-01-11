import type { RsbuildPlugin } from '@rsbuild/core';
import type { SwcReactConfig } from '@rsbuild/shared';

export type PluginPreactOptions = Record<string, never>;

export const pluginPreact = (
  _options: PluginPreactOptions = {},
): RsbuildPlugin => ({
  name: 'rsbuild:preact',

  pre: ['rsbuild:swc'],

  setup(api) {
    api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd }) => {
      chain.resolve.alias.merge({
        react: 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
      });

      const reactOptions: SwcReactConfig = {
        development: !isProd,
        runtime: 'automatic',
        importSource: 'preact',
      };

      chain.module
        .rule(CHAIN_ID.RULE.JS)
        .use(CHAIN_ID.USE.SWC)
        .tap((options) => {
          options.jsc.transform.react = {
            ...reactOptions,
          };
          return options;
        });

      if (chain.module.rules.has(CHAIN_ID.RULE.JS_DATA_URI)) {
        chain.module
          .rule(CHAIN_ID.RULE.JS_DATA_URI)
          .use(CHAIN_ID.USE.SWC)
          .tap((options) => {
            options.jsc.transform.react = {
              ...reactOptions,
            };
            return options;
          });
      }
    });
  },
});
