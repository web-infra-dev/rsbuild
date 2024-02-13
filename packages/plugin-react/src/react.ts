import path from 'node:path';
import {
  isUsingHMR,
  SCRIPT_REGEX,
  modifySwcLoaderOptions,
  type SwcReactConfig,
} from '@rsbuild/shared';
import type { RsbuildPluginAPI } from '@rsbuild/core';
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
