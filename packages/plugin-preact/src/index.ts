import type { RsbuildConfig, RsbuildPlugin } from '@rsbuild/core';
import { getNodeEnv, type SwcReactConfig } from '@rsbuild/shared';

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

    api.modifyRsbuildConfig((userConfig, { mergeRsbuildConfig }) => {
      const reactOptions: SwcReactConfig = {
        development: getNodeEnv() === 'development',
        runtime: 'automatic',
        importSource: 'preact',
      };

      const extraConfig: RsbuildConfig = {
        tools: {
          swc(opts) {
            opts.jsc ??= {};
            opts.jsc.transform ??= {};
            opts.jsc.transform.react = {
              ...opts.jsc.transform.react,
              ...reactOptions,
            };
            return opts;
          },
        },
      };

      if (reactAliasesEnabled) {
        extraConfig.source ||= {};
        extraConfig.source.alias = {
          react: 'preact/compat',
          'react-dom/test-utils': 'preact/test-utils',
          'react-dom': 'preact/compat',
          'react/jsx-runtime': 'preact/jsx-runtime',
        };
      }

      return mergeRsbuildConfig(extraConfig, userConfig);
    });
  },
});
