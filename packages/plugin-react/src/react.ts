import path from 'node:path';
import {
  isUsingHMR,
  SCRIPT_REGEX,
  modifySwcLoaderOptions,
  type SwcReactConfig,
} from '@rsbuild/shared';
import type { RsbuildConfig, RsbuildPluginAPI } from '@rsbuild/core';
import type { PluginReactOptions } from '.';

export const applyBasicReactSupport = (
  api: RsbuildPluginAPI,
  options: PluginReactOptions,
) => {
  const REACT_REFRESH_PATH = require.resolve('react-refresh');

  api.modifyBundlerChain(async (chain, { CHAIN_ID, isDev, isProd, target }) => {
    const config = api.getNormalizedConfig();
    const usingHMR = isUsingHMR(config, { isProd, target });
    const reactOptions: SwcReactConfig = {
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
    const enableReactProfilerConfig: RsbuildConfig = {
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
    return mergeRsbuildConfig(config, enableReactProfilerConfig);
  });

  api.modifyBundlerChain((chain, { isProd }) => {
    if (!isProd) return;
    // Replace react-dom with the profiling version.
    // Reference: https://gist.github.com/bvaughn/25e6233aeb1b4f0cdb8d8366e54a3977
    chain.resolve.alias.set('react-dom$', 'react-dom/profiling');
  });
};
