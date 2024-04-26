import type { RsbuildConfig, RsbuildPlugin, Rspack } from '@rsbuild/core';
import { getNodeEnv } from '@rsbuild/shared';

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
      const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
        development: getNodeEnv() === 'development',
        runtime: 'automatic',
        importSource: 'preact',
      };

      const extraConfig: RsbuildConfig = {
        tools: {
          swc: {
            jsc: {
              transform: {
                react: reactOptions,
              },
            },
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
