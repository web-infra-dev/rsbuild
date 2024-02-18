import type { RsbuildPlugin } from '@rsbuild/core';
import { modifySwcLoaderOptions, type SwcReactConfig } from '@rsbuild/shared';

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

  setup(api) {
    const { reactAliasesEnabled = true } = options;

    api.modifyBundlerChain(async (chain, { isDev }) => {
      if (reactAliasesEnabled) {
        chain.resolve.alias.merge({
          react: 'preact/compat',
          'react-dom/test-utils': 'preact/test-utils',
          'react-dom': 'preact/compat',
          'react/jsx-runtime': 'preact/jsx-runtime',
        });
      }

      const reactOptions: SwcReactConfig = {
        development: isDev,
        runtime: 'automatic',
        importSource: 'preact',
      };

      modifySwcLoaderOptions({
        chain,
        modifier: (opts) => {
          opts.jsc ??= {};
          opts.jsc.transform ??= {};
          opts.jsc.transform.react = {
            ...opts.jsc.transform.react,
            ...reactOptions,
          };
          return opts;
        },
      });
    });
  },
});
