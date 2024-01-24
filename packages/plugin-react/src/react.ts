import path from 'node:path';
import {
  deepmerge,
  isUsingHMR,
  modifySwcLoaderOptions,
  type SwcReactConfig,
} from '@rsbuild/shared';
import type { RsbuildPluginAPI } from '@rsbuild/core';
import type { PluginReactOptions } from '.';

export const REACT_REFRESH_PATH = require.resolve('react-refresh');
const REACT_REFRESH_DIR_PATH = path.dirname(REACT_REFRESH_PATH);

export const applyBasicReactSupport = (
  api: RsbuildPluginAPI,
  options: PluginReactOptions,
) => {
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
      modifier: (options) => {
        return deepmerge(options, {
          jsc: {
            transform: {
              react: reactOptions,
            },
          },
        });
      },
    });

    if (!usingHMR) {
      return;
    }

    chain.resolve.alias.set('react-refresh', REACT_REFRESH_DIR_PATH);

    const { default: ReactRefreshRspackPlugin } = await import(
      '@rspack/plugin-react-refresh'
    );

    chain
      .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
      .use(ReactRefreshRspackPlugin);
  });
};
