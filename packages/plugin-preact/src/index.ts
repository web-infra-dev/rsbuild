import type { EnvironmentConfig, RsbuildPlugin, Rspack } from '@rsbuild/core';

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

    api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
      const isDev = config.mode === 'development';
      const usingHMR =
        isDev && config.dev.hmr && config.output.target === 'web';
      const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
        development: config.mode === 'development',
        refresh: usingHMR && options.prefreshEnabled,
        runtime: 'automatic',
        importSource: 'preact',
      };

      const extraConfig: EnvironmentConfig = {
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

      return mergeEnvironmentConfig(extraConfig, config);
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

      const SCRIPT_REGEX = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
      const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

      chain.plugin('preact-refresh').use(PreactRefreshPlugin, [
        {
          include: [SCRIPT_REGEX],
          exclude: [NODE_MODULES_REGEX],
        },
      ]);
    });
  },
});
