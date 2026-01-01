import { createRequire } from 'node:module';
import type { EnvironmentConfig, RsbuildPlugin, Rspack } from '@rsbuild/core';

const require = createRequire(import.meta.url);

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
  /**
   * Include files to be processed by the `@rspack/plugin-preact-refresh` plugin.
   * The value is the same as the `rules[].test` option in Rspack.
   * @default /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/
   */
  include?: Rspack.RuleSetCondition;
  /**
   * Exclude files from being processed by the `@rspack/plugin-preact-refresh` plugin.
   * The value is the same as the `rules[].exclude` option in Rspack.
   * @default /[\\/]node_modules[\\/]/
   */
  exclude?: Rspack.RuleSetCondition;
};

export const PLUGIN_PREACT_NAME = 'rsbuild:preact';

export const pluginPreact = (
  userOptions: PluginPreactOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_PREACT_NAME,

  setup(api) {
    const options = {
      include: /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/,
      exclude: /[\\/]node_modules[\\/]/,
      prefreshEnabled: true,
      reactAliasesEnabled: true,
      ...userOptions,
    };

    // @rspack/plugin-preact-refresh does not support Windows yet
    if (process.platform === 'win32') {
      options.prefreshEnabled = false;
    }

    api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
      const isDev = config.mode === 'development';
      const usePrefresh =
        isDev &&
        options.prefreshEnabled &&
        config.dev.hmr &&
        config.output.target === 'web';

      const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
        development: config.mode === 'development',
        refresh: usePrefresh,
        runtime: 'automatic',
        importSource: 'preact',
      };

      const extraConfig: EnvironmentConfig = {
        tools: {
          swc: {
            jsc: {
              experimental: {
                plugins: usePrefresh
                  ? [[require.resolve('@swc/plugin-prefresh'), {}]]
                  : undefined,
              },
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

      extraConfig.source ||= {};
      extraConfig.resolve ||= {};

      if (usePrefresh) {
        // transpile `@prefresh/core` and `@prefresh/utils` to ensure browser compatibility
        extraConfig.source.include = [
          /node_modules[\\/]@prefresh[\\/](core|utils)/,
        ];
      }

      if (options.reactAliasesEnabled) {
        extraConfig.resolve.alias = {
          react: 'preact/compat',
          'react-dom/test-utils': 'preact/test-utils',
          'react-dom': 'preact/compat',
          'react/jsx-runtime': 'preact/jsx-runtime',
        };
      }

      return mergeEnvironmentConfig(extraConfig, config);
    });

    api.modifyBundlerChain(async (chain, { isDev, target }) => {
      const config = api.getNormalizedConfig();
      const usePrefresh =
        isDev && options.prefreshEnabled && config.dev.hmr && target === 'web';

      if (!usePrefresh) {
        return;
      }

      const { default: PreactRefreshPlugin } =
        await import('@rspack/plugin-preact-refresh');

      const preactPath = require.resolve('preact', {
        paths: [api.context.rootPath],
      });

      chain.plugin('preact-refresh').use(PreactRefreshPlugin, [
        {
          include: options.include,
          exclude: options.exclude,
          preactPath,
        },
      ]);
    });
  },
});
