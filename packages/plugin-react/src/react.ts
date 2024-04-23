import path from 'node:path';
import type { RsbuildConfig, RsbuildPluginAPI, Rspack } from '@rsbuild/core';
import {
  SCRIPT_REGEX,
  isUsingHMR,
  modifySwcLoaderOptions,
} from '@rsbuild/shared';
import type { PluginReactOptions } from '.';

export const applyBasicReactSupport = (
  api: RsbuildPluginAPI,
  options: PluginReactOptions,
) => {
  const REACT_REFRESH_PATH = require.resolve('react-refresh');

  api.modifyBundlerChain(async (chain, { CHAIN_ID, isDev, isProd, target }) => {
    const config = api.getNormalizedConfig();
    const usingHMR = isUsingHMR(config, { isProd, target });
    const reactOptions: Rspack.SwcLoaderTransformConfig['react'] = {
      development: isDev,
      refresh: usingHMR,
      runtime: 'automatic',
      ...options.swcReactOptions,
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

    if (!usingHMR) {
      return;
    }

    chain.resolve.alias.set('react-refresh', path.dirname(REACT_REFRESH_PATH));

    const { default: ReactRefreshRspackPlugin } = await import(
      '@rspack/plugin-react-refresh'
    );

    chain
      .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
      .use(ReactRefreshRspackPlugin, [{ include: [SCRIPT_REGEX] }]);
  });
};

export const applyReactProfiler = (api: RsbuildPluginAPI) => {
  api.modifyRsbuildConfig((config, { mergeRsbuildConfig }) => {
    const enableProfilerConfig: RsbuildConfig = {
      output: {
        minify: {
          jsOptions: {
            // Need to keep classnames and function names like Components for debugging purposes.
            mangle: {
              keep_classnames: true,
              keep_fnames: true,
            },
          },
        },
      },
    };
    return mergeRsbuildConfig(config, enableProfilerConfig);
  });

  api.modifyBundlerChain((chain) => {
    // Replace react-dom with the profiling version.
    // Reference: https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
    chain.resolve.alias.set('react-dom$', 'react-dom/profiling');
    chain.resolve.alias.set('scheduler/tracing', 'scheduler/tracing-profiling');
  });
};
