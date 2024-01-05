import path from 'node:path';
import { isUsingHMR } from '@rsbuild/shared';
import type { RsbuildPluginAPI } from '@rsbuild/core';

export const REACT_REFRESH_PATH = require.resolve('react-refresh');
const REACT_REFRESH_DIR_PATH = path.dirname(REACT_REFRESH_PATH);

export const applyBasicReactSupport = (api: RsbuildPluginAPI) => {
  api.modifyBundlerChain(async (chain, { CHAIN_ID, isProd, target }) => {
    const config = api.getNormalizedConfig();
    const usingHMR = isUsingHMR(config, { isProd, target });
    const rule = chain.module.rule(CHAIN_ID.RULE.JS);

    const reactOptions = {
      development: !isProd,
      refresh: usingHMR,
      runtime: 'automatic',
    };

    rule.use(CHAIN_ID.USE.SWC).tap((options) => {
      options.jsc.transform.react = {
        ...reactOptions,
      };
      return options;
    });

    if (chain.module.rules.has(CHAIN_ID.RULE.JS_DATA_URI)) {
      chain.module
        .rule(CHAIN_ID.RULE.JS_DATA_URI)
        .use(CHAIN_ID.USE.SWC)
        .tap((options) => {
          options.jsc.transform.react = {
            ...reactOptions,
          };
          return options;
        });
    }

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
