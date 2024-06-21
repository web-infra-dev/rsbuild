import type { RsbuildPlugin } from '@rsbuild/core';
import type { PluginAssetsRetryOptions } from './types';

export type { PluginAssetsRetryOptions };

export const PLUGIN_ASSETS_RETRY_NAME = 'rsbuild:assets-retry';

export const pluginAssetsRetry = (
  options: PluginAssetsRetryOptions = {},
): RsbuildPlugin => ({
  name: PLUGIN_ASSETS_RETRY_NAME,
  setup(api) {
    api.modifyBundlerChain(
      async (chain, { CHAIN_ID, HtmlPlugin, isProd, environment }) => {
        const config = api.getNormalizedConfig();

        const htmlPaths = api.getHTMLPaths({ environment });
        if (!options || Object.keys(htmlPaths).length === 0) {
          return;
        }

        const { AssetsRetryPlugin } = await import('./AssetsRetryPlugin');
        const { AsyncChunkRetryPlugin } = await import(
          './AsyncChunkRetryPlugin'
        );
        const distDir = config.output.distPath.js;

        // options.crossOrigin should be same as html.crossorigin by default
        if (options.crossOrigin === undefined) {
          options.crossOrigin = config.html.crossorigin;
        }

        if (options.minify === undefined) {
          const minify =
            typeof config.output.minify === 'boolean'
              ? config.output.minify
              : config.output.minify?.js;
          options.minify = minify && isProd;
        }

        chain.plugin(CHAIN_ID.PLUGIN.ASSETS_RETRY).use(AssetsRetryPlugin, [
          {
            ...options,
            distDir,
            HtmlPlugin,
          },
        ]);

        const isRspack = api.context.bundlerType === 'rspack';
        chain
          .plugin(CHAIN_ID.PLUGIN.ASYNC_CHUNK_RETRY)
          .use(AsyncChunkRetryPlugin, [{ ...options, isRspack }]);
      },
    );
  },
});
