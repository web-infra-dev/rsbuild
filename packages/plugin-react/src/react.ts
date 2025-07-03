import { createRequire } from 'node:module';
import path from 'node:path';
import type {
  EnvironmentConfig,
  RsbuildConfig,
  RsbuildPluginAPI,
  Rspack,
} from '@rsbuild/core';
import type { PluginReactOptions } from './index.js';

const require = createRequire(import.meta.url);

export const applyBasicReactSupport = (
  api: RsbuildPluginAPI,
  options: PluginReactOptions,
): void => {
  const REACT_REFRESH_PATH = options.fastRefresh
    ? require.resolve('react-refresh')
    : '';

  api.modifyEnvironmentConfig((config, { mergeEnvironmentConfig }) => {
    const isDev = config.mode === 'development';
    const usingHMR = isDev && config.dev.hmr && config.output.target === 'web';

    const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
      development: isDev,
      refresh: usingHMR && options.fastRefresh,
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

    return mergeEnvironmentConfig(extraConfig, config);
  });

  api.modifyBundlerChain(
    async (chain, { CHAIN_ID, environment, isDev, target }) => {
      const { config } = environment;
      const usingHMR = isDev && config.dev.hmr && target === 'web';
      if (!usingHMR || !options.fastRefresh) {
        return;
      }

      chain.resolve.alias.set(
        'react-refresh',
        path.dirname(REACT_REFRESH_PATH),
      );

      const { ReactRefreshRspackPlugin } = await import(
        '@rspack/plugin-react-refresh'
      );
      const SCRIPT_REGEX = /\.(?:js|jsx|mjs|cjs|ts|tsx|mts|cts)$/;
      const NODE_MODULES_REGEX = /[\\/]node_modules[\\/]/;

      chain
        .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
        .use(ReactRefreshRspackPlugin, [
          {
            include: [SCRIPT_REGEX],
            exclude: [NODE_MODULES_REGEX],
            resourceQuery: { not: /raw/ },
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

  // react-dom/client was introduced in React 18
  let hasReactDomClientCache: boolean | undefined;
  const hasReactDomClient = () => {
    if (hasReactDomClientCache !== undefined) {
      return hasReactDomClientCache;
    }

    try {
      require.resolve('react-dom/client', {
        paths: [api.context.rootPath],
      });
      hasReactDomClientCache = true;
    } catch {
      hasReactDomClientCache = false;
    }

    return hasReactDomClientCache;
  };

  api.modifyBundlerChain((chain, { isProd }) => {
    if (!isProd) {
      return;
    }

    // Replace react-dom with the profiling version.
    // For React 18+, we need to replace `react-dom/client` with `react-dom/profiling`.
    // Reference: https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
    chain.resolve.alias.set(
      hasReactDomClient() ? 'react-dom/client$' : 'react-dom$',
      'react-dom/profiling',
    );
    chain.resolve.alias.set('scheduler/tracing', 'scheduler/tracing-profiling');
  });
};
