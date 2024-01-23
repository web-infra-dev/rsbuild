import {
  PLUGIN_CSS_NAME,
  PLUGIN_SASS_NAME,
  PLUGIN_LESS_NAME,
  PLUGIN_STYLUS_NAME,
  type RsbuildPlugin,
} from '@rsbuild/core';
import { getDistPath } from '@rsbuild/shared';
import { cloneDeep } from '@rsbuild/shared';
import type { PluginRemOptions, PxToRemOptions } from './types';

const defaultOptions: PluginRemOptions = {
  enableRuntime: true,
  rootFontSize: 50,
};

export type { PluginRemOptions };

export const pluginRem = (options: PluginRemOptions = {}): RsbuildPlugin => ({
  name: 'rsbuild:rem',

  pre: [
    PLUGIN_CSS_NAME,
    PLUGIN_SASS_NAME,
    PLUGIN_LESS_NAME,
    PLUGIN_STYLUS_NAME,
  ],

  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, isServer, isWebWorker, HtmlPlugin }) => {
        const config = api.getNormalizedConfig();

        if (isServer || isWebWorker) {
          return;
        }

        const userOptions = {
          ...defaultOptions,
          ...options,
        };

        // handle css
        const { default: PxToRemPlugin } = (await import(
          '../compiled/postcss-pxtorem/index.js'
        )) as {
          default: (_opts: PxToRemOptions) => any;
        };

        const applyRules = [
          CHAIN_ID.RULE.CSS,
          CHAIN_ID.RULE.LESS,
          CHAIN_ID.RULE.SASS,
          CHAIN_ID.RULE.STYLUS,
        ];

        const getPxToRemPlugin = () =>
          PxToRemPlugin({
            rootValue: userOptions.rootFontSize,
            unitPrecision: 5,
            propList: ['*'],
            ...(userOptions.pxtorem ? cloneDeep(userOptions.pxtorem) : {}),
          });

        // Deep copy options to prevent unexpected behavior.
        applyRules.forEach((name) => {
          chain.module.rules.has(name) &&
            chain.module
              .rule(name)
              .use(CHAIN_ID.USE.POSTCSS)
              .tap((options = {}) => ({
                ...options,
                postcssOptions: {
                  ...(options.postcssOptions || {}),
                  plugins: [
                    ...(options.postcssOptions?.plugins || []),
                    getPxToRemPlugin(),
                  ],
                },
              }));
        });

        // handle runtime (html)
        if (!userOptions.enableRuntime) {
          return;
        }

        const { AutoSetRootFontSizePlugin } = await import(
          './AutoSetRootFontSizePlugin'
        );

        const entries = Object.keys(chain.entryPoints.entries() || {});
        const distDir = getDistPath(config, 'js');

        chain
          .plugin(CHAIN_ID.PLUGIN.AUTO_SET_ROOT_SIZE)
          .use(AutoSetRootFontSizePlugin, [
            userOptions,
            entries,
            HtmlPlugin,
            distDir,
          ]);
      },
    );
  },
});
