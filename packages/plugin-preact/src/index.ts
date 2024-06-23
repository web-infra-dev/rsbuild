import type { RsbuildConfig, RsbuildPlugin, Rspack } from '@rsbuild/core';
import { SCRIPT_REGEX } from '@rsbuild/shared';

export type PluginPreactOptions = {
  /**
   * Whether to aliases `react`, `react-dom` to `preact/compat`
   * @default true
   */
  reactAliasesEnabled?: boolean;
  /**
   * Whether to inject Prefresh for HMR
   * @default true
   */
  prefreshEnabled?: boolean;
};

export const PLUGIN_PREACT_NAME = 'rsbuild:preact';

export const pluginPreact = (
  options: PluginPreactOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_PREACT_NAME,

  setup(api) {
    const { reactAliasesEnabled = true, prefreshEnabled = true } = options;

    api.modifyRsbuildConfig((userConfig, { mergeRsbuildConfig }) => {
      const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
        development: process.env.NODE_ENV === 'development',
        runtime: 'automatic',
        importSource: 'preact',
      };

      const extraConfig: RsbuildConfig = {
        tools: {
          swc: {
            jsc: {
              parser: {
                syntax: 'typescript',
                // enable supports for JSX/TSX compilation
                tsx: true,
              },
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

    api.modifyBundlerChain(async (chain, { isProd, target }) => {
      const config = api.getNormalizedConfig();
      const usingHMR = !isProd && config.dev.hmr && target === 'web';

      if (!usingHMR || !prefreshEnabled) {
        return;
      }

      const { default: PreactRefreshPlugin } = await import(
        '@rspack/plugin-preact-refresh'
      );

      // @ts-expect-error https://github.com/web-infra-dev/rspack/pull/6850
      chain.plugin('preact-refresh').use(PreactRefreshPlugin, [
        {
          include: [SCRIPT_REGEX],
        },
      ]);
    });
  },
});
