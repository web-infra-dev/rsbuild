import path from 'node:path';
import type {
  EnvironmentConfig,
  RsbuildConfig,
  RsbuildPluginAPI,
  Rspack,
} from '@rsbuild/core';
import type { PluginReactOptions } from '.';

export const applyBasicReactSupport = (
  api: RsbuildPluginAPI,
  options: PluginReactOptions,
): void => {
  const REACT_REFRESH_PATH = require.resolve('react-refresh');

  api.modifyEnvironmentConfig((userConfig, { mergeEnvironmentConfig }) => {
    const isDev = userConfig.mode === 'development';

    const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
      development: isDev,
      refresh:
        isDev && userConfig.dev.hmr && userConfig.output.target === 'web',
      runtime: 'automatic',
      ...options.swcReactOptions,
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

    return mergeEnvironmentConfig(extraConfig, userConfig);
  });

  api.modifyBundlerChain(
    async (chain, { CHAIN_ID, environment, isProd, target }) => {
      const { config } = environment;
      const usingHMR = !isProd && config.dev.hmr && target === 'web';
      if (!usingHMR) {
        return;
      }

      chain.resolve.alias.set(
        'react-refresh',
        path.dirname(REACT_REFRESH_PATH),
      );

      const { default: ReactRefreshRspackPlugin } = await import(
        '@rspack/plugin-react-refresh'
      );
      const SCRIPT_REGEX = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;

      chain
        .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
        .use(ReactRefreshRspackPlugin, [
          {
            include: [SCRIPT_REGEX],
            ...options.reactRefreshOptions,
          },
        ]);
    },
  );
};

export const applyReactProfiler = (api: RsbuildPluginAPI): void => {
  api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
    if (config.mode !== 'production') {
      return;
    }

    const enableProfilerConfig: RsbuildConfig = {
      output: {
        minify: {
          jsOptions: {
            minimizerOptions: {
              // Need to keep classnames and function names like Components for debugging purposes.
              mangle: {
                keep_classnames: true,
                keep_fnames: true,
              },
            },
          },
        },
      },
    };
    return mergeEnvironmentConfig(config, enableProfilerConfig);
  });

  api.modifyBundlerChain((chain, { isProd }) => {
    if (!isProd) {
      return;
    }

    // Replace react-dom with the profiling version.
    // Reference: https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
    chain.resolve.alias.set('react-dom$', 'react-dom/profiling');
    chain.resolve.alias.set('scheduler/tracing', 'scheduler/tracing-profiling');
  });
};
