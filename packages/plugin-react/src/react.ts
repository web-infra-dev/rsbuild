import type { RsbuildConfig } from '@rsbuild/core';
import {
  isProd,
  isUsingHMR,
  isBeyondReact17,
  type SharedRsbuildPluginAPI,
} from '@rsbuild/shared';
import type { RsbuildPluginAPI } from '@rsbuild/webpack';

const applyRspack = (api: SharedRsbuildPluginAPI) => {
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

    const { default: ReactRefreshRspackPlugin } = await import(
      // @ts-expect-error
      '@rspack/plugin-react-refresh'
    );

    chain
      .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
      .use(ReactRefreshRspackPlugin);
  });
};

const applyWebpack = (api: SharedRsbuildPluginAPI) => {
  api.modifyRsbuildConfig(async (config, { mergeRsbuildConfig }) => {
    const babelConfig: RsbuildConfig = {
      tools: {
        babel(_, { addPresets, addPlugins }) {
          const isNewJsx = isBeyondReact17(api.context.rootPath);
          const presetReactOptions = {
            development: !isProd(),
            // Will use the native built-in instead of trying to polyfill
            useBuiltIns: true,
            useSpread: false,
            runtime: isNewJsx ? 'automatic' : 'classic',
          };

          addPresets([
            [require.resolve('@babel/preset-react'), presetReactOptions],
          ]);

          if (isProd()) {
            addPlugins([
              [
                require.resolve(
                  'babel-plugin-transform-react-remove-prop-types',
                ),
                { removeImport: true },
              ],
            ]);
          }
        },
      },
    };

    return mergeRsbuildConfig(babelConfig, config);
  });

  (api as RsbuildPluginAPI).modifyWebpackChain(async (chain, utils) => {
    const config = (api as RsbuildPluginAPI).getNormalizedConfig();

    if (!isUsingHMR(config, utils)) {
      return;
    }

    const { CHAIN_ID } = utils;
    const { default: ReactFastRefreshPlugin } = await import(
      '@pmmmwh/react-refresh-webpack-plugin'
    );
    const useTsLoader = Boolean(config.tools.tsLoader);
    const rule = useTsLoader
      ? chain.module.rule(CHAIN_ID.RULE.TS)
      : chain.module.rule(CHAIN_ID.RULE.JS);

    rule.use(CHAIN_ID.USE.BABEL).tap((options) => ({
      ...options,
      plugins: [
        ...(options.plugins || []),
        [require.resolve('react-refresh/babel'), { skipEnvCheck: true }],
      ],
    }));

    chain
      .plugin(CHAIN_ID.PLUGIN.REACT_FAST_REFRESH)
      .use(ReactFastRefreshPlugin, [
        {
          overlay: false,
          exclude: [/node_modules/],
        },
      ]);
  });
};

export const applyBasicReactSupport = (api: SharedRsbuildPluginAPI) => {
  const { bundlerType } = api.context;

  bundlerType === 'rspack' ? applyRspack(api) : applyWebpack(api);
};
